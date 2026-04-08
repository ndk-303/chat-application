import FriendRequestModel from '../models/FriendRequest';
import FriendshipModel from '../models/Friendship';
import UserModel from '../models/User';
import { emitToUser } from '../socket/socketManager';
import { errorUtil } from '../utils/errorUtils';

export const sendFriendRequest = async (senderId: string, receiverId: string) => {
    const sender = await UserModel.findById(senderId);
    const receiver = await UserModel.findById(receiverId);

    if (!sender || !receiver) {
        throw new errorUtil('Không tìm thấy người dùng', 400);
    }

    if (senderId === receiverId) {
        throw new errorUtil('Không thể gửi lời mời kết bạn cho chính mình', 400);
    }

    const existingFriendship = await FriendshipModel.findOne({
        $or: [
            { user1Id: senderId, user2Id: receiverId },
            { user1Id: receiverId, user2Id: senderId }
        ]
    });

    if (existingFriendship) {
        throw new errorUtil('Hai người đã là bạn bè', 400);
    }

    const existingRequest = await FriendRequestModel.findOne({
        senderId,
        receiverId,
        status: 'pending'
    });

    if (existingRequest) {
        throw new errorUtil('Đã gửi lời mời kết bạn trước đó', 400);
    }

    const reverseRequest = await FriendRequestModel.findOne({
        senderId: receiverId,
        receiverId: senderId,
        status: 'pending'
    });

    if (reverseRequest) {
        throw new errorUtil('Người này đã gửi lời mời kết bạn cho bạn', 400);
    }

    const friendRequest = await FriendRequestModel.create({
        senderId,
        receiverId,
        status: 'pending'
    });

    try {
        await friendRequest.populate('senderId', 'displayName email avatar status');
        emitToUser(receiverId, 'friend_request_received', friendRequest);
    } catch (_) { }

    return friendRequest;
};

export const acceptFriendRequest = async (requestId: string, userId: string) => {
    const request = await FriendRequestModel.findById(requestId);

    if (!request) {
        throw new errorUtil('Không tìm thấy lời mời kết bạn', 400);
    }

    if (request.receiverId.toString() !== userId) {
        throw new errorUtil('Bạn không có quyền chấp nhận lời mời này', 400);
    }

    if (request.status !== 'pending') {
        throw new errorUtil('Lời mời kết bạn không còn ở trạng thái chờ', 400);
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

    try {
        emitToUser(request.senderId.toString(), 'friend_request_accepted', {
            requestId: request._id,
            friendship
        });
    } catch (_) { }

    return { friendRequest: request, friendship };
};

export const rejectFriendRequest = async (requestId: string, userId: string) => {
    const request = await FriendRequestModel.findById(requestId);

    if (!request) {
        throw new errorUtil('Không tìm thấy lời mời kết bạn', 400);
    }

    if (request.receiverId.toString() !== userId) {
        throw new errorUtil('Bạn không có quyền từ chối lời mời này', 400);
    }

    if (request.status !== 'pending') {
        throw new errorUtil('Lời mời kết bạn không còn ở trạng thái chờ', 400);
    }

    request.status = 'rejected';
    await request.save();

    try {
        emitToUser(request.senderId.toString(), 'friend_request_rejected', {
            requestId: request._id
        });
    } catch (_) { }

    return request;
};

export const getFriendsList = async (userId: string) => {
    const friendships = await FriendshipModel.find({
        $or: [
            { user1Id: userId },
            { user2Id: userId }
        ]
    }).populate('user1Id user2Id', 'displayName email avatar status lastSeen');

    const friends = friendships.map(friendship => {
        const friend = friendship.user1Id._id.toString() === userId
            ? friendship.user2Id
            : friendship.user1Id;
        const friendObj = (friend as any).toObject ? (friend as any).toObject() : friend;
        return {
            ...friendObj,
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
        throw new errorUtil('Không tìm thấy quan hệ bạn bè', 400);
    }

    await FriendshipModel.deleteOne({ _id: friendship._id });

    return { message: 'Đã xóa bạn bè thành công' };
};
