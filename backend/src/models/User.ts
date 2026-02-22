import mongoose, { Document, Schema, Model, model } from 'mongoose';

export interface User extends Document {
    email?: string;
    password: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
    lastSeen?: Date;
    isEmailVerified?: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    refreshTokens?: string;
    settings: {
        notifications: {
            messages: boolean;
            friendRequests: boolean;
            calls: boolean;
        };
        privacy: {
            showOnlineStatus: boolean;
            showLastSeen: boolean;
            allowFriendRequests: boolean;
        };
    };
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<User>(
    {
        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address'
            ],
            index: true
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false
        },
        displayName: {
            type: String,
            trim: true,
            maxlength: [50, 'Display name cannot exceed 50 characters']
        },
        avatar: {
            type: String,
            default: null
        },
        bio: {
            type: String,
            maxlength: [200, 'Bio cannot exceed 200 characters'],
            default: ''
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'away', 'busy'],
            default: 'offline'
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            select: false
        },
        emailVerificationExpires: {
            type: Date,
            select: false
        },
        passwordResetToken: {
            type: String,
            select: false
        },
        passwordResetExpires: {
            type: Date,
            select: false
        },
        refreshTokens: { type: String, required: false },
        settings: {
            notifications: {
                messages: { type: Boolean, default: true },
                friendRequests: { type: Boolean, default: true },
                calls: { type: Boolean, default: true }
            },
            privacy: {
                showOnlineStatus: { type: Boolean, default: true },
                showLastSeen: { type: Boolean, default: true },
                allowFriendRequests: { type: Boolean, default: true }
            },
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            select: false
        }
    },
);

const UserModel = model<User>('User', userSchema);
export default UserModel;
