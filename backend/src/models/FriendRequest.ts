import mongoose, { Document, Schema, Model } from 'mongoose';

export interface FriendRequest extends Document {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const friendRequestSchema = new Schema<FriendRequest>(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
            index: true
        }
    },
    {
        timestamps: true
    }
);

friendRequestSchema.index({ senderId: 1, receiverId: 1 });

friendRequestSchema.index({ receiverId: 1, status: 1 });

const FriendRequestModel = mongoose.model<FriendRequest>('FriendRequest', friendRequestSchema);
export default FriendRequestModel;
