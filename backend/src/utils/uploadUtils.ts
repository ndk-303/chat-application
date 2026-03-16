import cloudinary from "../config/cloudinary";

export const uploadCloundinary = (
    buffer: Buffer,
    folder: string,
    type: 'image' | 'video' | 'raw'
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: type,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};