import mongoose, { Document, Schema } from 'mongoose';

interface Seen {
    userId: mongoose.Types.ObjectId;
    seenAt: Date;
}

export interface MessageReaction {
    emoji: string;
    userIds: mongoose.Types.ObjectId[];
}

export interface MessageFile {
    url: string;
    publicId: string;
    originalName: string;
    size: number;
    mimeType: string;
    type: 'image' | 'video' | 'raw';
}

export interface CallMeta {
    callType: 'audio' | 'video';
    callDuration: number;
    callStatus: 'ended' | 'missed' | 'rejected';
}

export interface Message extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    type: 'text' | 'system' | 'call';
    files?: MessageFile[];
    status: 'sent' | 'delivered' | 'seen';
    seenBy: Seen[];
    reactions: MessageReaction[];
    callMeta?: CallMeta;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<Message>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        content: {
            type: String,
            default: '',
            trim: true,
            maxlength: [3000, 'Content cannot exceed 3000 characters']
        },
        type: {
            type: String,
            enum: ['text', 'system', 'call'],
            default: 'text',
            index: true
        },
        files: [{
            url:          { type: String, required: true },
            publicId:     { type: String, required: true },
            originalName: { type: String, default: 'file' },
            size:         { type: Number, default: 0 },
            mimeType:     { type: String, default: 'application/octet-stream' },
            type:         { type: String, enum: ['image', 'video', 'raw'], required: true },
        }],
        status: {
            type: String,
            enum: ['sent', 'delivered', 'seen'],
            default: 'sent',
            index: true
        },
        seenBy: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            seenAt: {
                type: Date,
                default: Date.now
            }
        }],
        reactions: [{
            emoji: { type: String, required: true },
            userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }]
        }],
        callMeta: {
            callType: { type: String, enum: ['audio', 'video'] },
            callDuration: { type: Number, default: 0 }, // seconds
            callStatus: { type: String, enum: ['ended', 'missed', 'rejected'], default: 'ended' },
        },
    },
    {
        timestamps: true
    }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const MessageModel = mongoose.model<Message>('Message', messageSchema);
export default MessageModel;
