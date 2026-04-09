import mongoose, { Document, Schema } from 'mongoose';

export interface HiddenForEntry {
    userId: mongoose.Types.ObjectId;
    hiddenAt: Date;
}

export interface MutedForEntry {
    userId: mongoose.Types.ObjectId;
    mutedUntil?: Date; // undefined = vĩnh viễn
}

export interface PinnedForEntry {
    userId: mongoose.Types.ObjectId;
    pinnedAt: Date;
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
    mutedFor: MutedForEntry[];
    pinnedFor: PinnedForEntry[];
    inviteToken?: string;
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
        }],
        mutedFor: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            mutedUntil: { type: Date, default: null }
        }],
        pinnedFor: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            pinnedAt: { type: Date, required: true }
        }],
        inviteToken: {
            type: String,
            unique: true,
            sparse: true,
            default: null
        }
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
