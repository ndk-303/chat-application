import mongoose, { Document, Schema } from 'mongoose';

export interface HiddenForEntry {
    userId: mongoose.Types.ObjectId;
    hiddenAt: Date;
}

export interface Conversation extends Document {
    type: 'private' | 'group';
    participants: mongoose.Types.ObjectId[];
    name?: string;
    avatar?: string;
    adminId?: mongoose.Types.ObjectId;
    lastMessageId?: mongoose.Types.ObjectId;
    lastMessageAt?: Date;
    hiddenFor: HiddenForEntry[];
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<Conversation>(
    {
        type: {
            type: String,
            enum: ['private', 'group'],
            required: true,
            index: true
        },
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'Conversation name cannot exceed 100 characters']
        },
        avatar: {
            type: String,
            default: null
        },
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        lastMessageId: {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        },
        lastMessageAt: {
            type: Date,
            index: true
        },
        hiddenFor: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            hiddenAt: { type: Date, required: true }
        }]
    },
    {
        timestamps: true
    }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ type: 1, participants: 1 });

const ConversationModel = mongoose.model<Conversation>('Conversation', conversationSchema);
export default ConversationModel;
