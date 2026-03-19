import cloudinary from "../config/cloudinary";

const UPLOAD_TIMEOUT_MS = 30_000; // 30 seconds

export const uploadCloundinary = (
    buffer: Buffer,
    folder: string,
    type: 'image' | 'video' | 'raw'
): Promise<any> => {
    // Validate credentials before attempting upload so we fail fast
    const cfg = cloudinary.config();
    if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
        return Promise.reject(
            new Error(
                'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME (or CLOUDINARY_NAME), CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
            )
        );
    }

    return new Promise((resolve, reject) => {
        // Safety timeout so the request never hangs indefinitely
        const timer = setTimeout(() => {
            reject(new Error(`Cloudinary upload timed out after ${UPLOAD_TIMEOUT_MS / 1000}s`));
        }, UPLOAD_TIMEOUT_MS);

        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: type },
            (error, result) => {
                clearTimeout(timer);
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};