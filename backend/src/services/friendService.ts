import FriendRequestModel from '../models/FriendRequest';
import FriendshipModel from '../models/Friendship';
import UserModel from '../models/User';

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
    const sender = await UserModel.findById(senderId);
    const receiver = await UserModel.findById(receiverId);

    if (!sender || !receiver) {
        throw new Error('User not found');
    }

    if (senderId === receiverId) {
        throw new Error('Cannot send friend request to yourself');
    }

    const existingFriendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: senderId, user2Id: receiverId },
            { user1Id: receiverId, user2Id: senderId }
        ]
    });

    if (existingFriendship) {
        throw new Error('Already friends with this user');
    }

    const existingRequest = await FriendRequestModel.findOne({
        senderId,
        receiverId,
        status: 'pending'
    });

    if (existingRequest) {
        throw new Error('Friend request already sent');
    }

    const reverseRequest = await FriendRequestModel.findOne({
        senderId: receiverId,
        receiverId: senderId,
        status: 'pending'
    });

    if (reverseRequest) {
        throw new Error('This user has already sent you a friend request');
    }

    const friendRequest = await FriendRequestModel.create({
        senderId,
        receiverId,
        status: 'pending'
    });

    return friendRequest;
};

export const acceptFriendRequest = async (requestId: string, userId: string) => {
    const request = await FriendRequestModel.findById(requestId);

    if (!request) {
        throw new Error('Friend request not found');
    }

    if (request.receiverId.toString() !== userId) {
        throw new Error('Unauthorized to accept this friend request');
    }

    if (request.status !== 'pending') {
        throw new Error('Friend request is not pending');
    }

    request.status = 'accepted';
    await request.save();

    const user1Id = request.senderId.toString() < request.receiverId.toString()
        ? request.senderId
        : request.receiverId;
    const user2Id = request.senderId.toString() < request.receiverId.toString()
        ? request.receiverId
        : request.senderId;

    const friendship = await FriendshipModel.create({
        user1Id,
        user2Id
    });

    return { friendRequest: request, friendship };
};

export const rejectFriendRequest = async (requestId: string, userId: string) => {
    const request = await FriendRequestModel.findById(requestId);

    if (!request) {
        throw new Error('Friend request not found');
    }

    if (request.receiverId.toString() !== userId) {
        throw new Error('Unauthorized to reject this friend request');
    }

    if (request.status !== 'pending') {
        throw new Error('Friend request is not pending');
    }

    request.status = 'rejected';
    await request.save();

    return request;
};

export const getFriendsList = async (userId: string) => {
    const friendships = await FriendshipModel.find({
        $or: [
            { user1Id: userId },
            { user2Id: userId }
        ]
    }).populate('user1Id user2Id', 'displayName email avatar status lastSeen');

    const friends = friendships.map((friendship: any) => {
        const friend = friendship.user1Id._id.toString() === userId
            ? friendship.user2Id
            : friendship.user1Id;
        return {
            ...friend,
            friendshipCreatedAt: friendship.createdAt
        };
    });

    return friends;
};

export const getReceivedRequests = async (userId: string) => {
    const requests = await FriendRequestModel.find({
        receiverId: userId,
        status: 'pending'
    })
        .populate('senderId', 'displayName email avatar status')
        .sort({ createdAt: -1 });

    return requests;
};

export const getSentRequests = async (userId: string) => {
    const requests = await FriendRequestModel.find({
        senderId: userId,
        status: 'pending'
    })
        .populate('receiverId', 'displayName email avatar status')
        .sort({ createdAt: -1 });

    return requests;
};

export const removeFriendship = async (userId: string, friendId: string) => {
    const friendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: userId, user2Id: friendId },
            { user1Id: friendId, user2Id: userId }
        ]
    });

    if (!friendship) {
        throw new Error('Friendship not found');
    }

    await FriendshipModel.deleteOne({ _id: friendship._id });

    return { message: 'Friendship removed successfully' };
};
