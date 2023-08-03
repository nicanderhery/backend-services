export const getUnixDate = (date: string): number => {
    return new Date(date).getTime();
};

export const getUTCDate = (date: string | number): string => {
    return new Date(date).toUTCString();
};

export const isUnixDate = (date: string): boolean => {
    return /^\d+$/.test(date);
};

export const isValidDate = (date: string): boolean => {
    return !isNaN(Date.parse(date));
};
