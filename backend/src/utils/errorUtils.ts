export class errorUtil extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        // Giữ đúng stack trace trong V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, errorUtil);
        }
    }
}
