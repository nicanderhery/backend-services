import crypto from 'crypto';
import dns from 'dns';

const shortcuts = new Map<string, string>();

const hashString = (str: string) => {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
};

const isUrlValid = async (url: string) => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const lookupPromise = new Promise((resolve, reject) => {
            dns.lookup(hostname, (err, address) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(address);
                }
            });
        });
        await lookupPromise;

        // Check if the URL starts with http:// or https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return false;
        }

        return true;
    } catch (err) {
        return false;
    }
};

export const addShortcut = async (url: string) => {
    if (!(await isUrlValid(url))) {
        return null;
    }

    const hashedUrl = hashString(url);

    const exist = shortcuts.has(hashedUrl);
    if (!exist) {
        shortcuts.set(hashedUrl, url);
    }

    return {
        original_url: url,
        short_url: hashedUrl,
    };
};

export const getOriginalUrl = (hash: string) => {
    return shortcuts.get(hash);
};
