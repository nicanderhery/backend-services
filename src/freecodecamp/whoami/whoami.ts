import { Request } from 'express';

export const getUserInfo = (req: Request) => {
    const ipaddress = req.ip;
    const language = req.headers['accept-language'];
    const software = req.headers['user-agent'];
    return {
        ipaddress: ipaddress,
        language: language,
        software: software,
    };
};
