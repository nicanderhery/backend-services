export const getMetadata = (file: Express.Multer.File) => {
    return {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
    };
};
