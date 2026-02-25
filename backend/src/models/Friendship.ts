import mongoose, { Document, Schema } from 'mongoose';

export interface Friendship extends Document {
    user1Id: mongoose.Types.ObjectId;
    user2Id: mongoose.Types.ObjectId;
    createdAt: Date;
}

const friendshipSchema = new Schema<Friendship>(
    {
        user1Id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        user2Id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

friendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

const FriendshipModel = mongoose.model<Friendship>('Friendship', friendshipSchema);
export default FriendshipModel;
