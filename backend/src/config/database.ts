import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI ?? '';
        await mongoose.connect(MONGO_URI, {
            autoIndex: true,
        });

    } catch (error) {
        process.exit(1);
    }
}

export default connectDB;