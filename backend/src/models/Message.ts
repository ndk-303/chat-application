import mongoose, { Document, Schema } from 'mongoose';

interface Seen {
    userId: mongoose.Types.ObjectId;
    seenAt: Date;
}

export interface Message extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    status: 'sent' | 'recieved' | 'seen';
    seenBy: Seen[];
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
            required: [true, 'Content is required'],
            trim: true,
            maxlength: [300, 'Content cannot exceed 300 characters']
        },
        status: {
            type: String,
            enum: ['sent', 'recieved', 'seen'],
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
        }]
    },
    {
        timestamps: true
    }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const MessageModel = mongoose.model<Message>('Message', messageSchema);
export default MessageModel;
