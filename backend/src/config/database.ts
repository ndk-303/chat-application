import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI ?? '';
        await mongoose.connect(MONGO_URI, {
            autoIndex: true,
        });

    } catch (error) {
        console.error('[DB] MongoDB connection failed:', error);
        process.exit(1);
    }
}

export default connectDB;