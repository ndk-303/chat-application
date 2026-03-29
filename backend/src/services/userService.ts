import UserModel, { User } from "../models/User"
import { getCache, setCache, delCache } from '../utils/cacheUtils';

export const createUser = async (data: User): Promise<Object> => {
    const checked = await UserModel.findOne({ email: data.email })

    if (checked) {
        throw new Error('Email đã được sử dụng');
    }

    const user = await UserModel.create(data);

    return {
        userId: user._id,
        message: 'Tạo người dùng thành công',
    };
}

export const getUsers = async (page?: string, limit?: string, sortBy?: string): Promise<User[]> => {
    const pagination = page ? Number(page) : 1;
    const limitation = limit ? Number(limit) : 10;
    const skip = (pagination - 1) * limitation;
    const sort = sortBy ?? 'createdAt';

    const users = await UserModel.find().select('-password -updatedAt -deletedAt').skip(skip).limit(limitation).sort(sort);

    if (users.length === 0) {
        throw new Error('Không tìm thấy người dùng nào')
    }

    return users;
}

export const getUserById = async (id: string): Promise<User> => {
    const cacheKey = `cache:user:${id}`;

    // 1. Cache hit
    const cached = await getCache<User>(cacheKey);
    if (cached) return cached;

    // 2. Cache miss — query MongoDB
    const user = await UserModel.findOne({ _id: id }).select('-password -createdAt -updatedAt -deletedAt');

    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }

    // 3. Populate cache (5 phút)
    await setCache(cacheKey, user.toObject(), 300);

    return user;
}


export const updateUser = async (id: string, data: User) => {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });

    if (!user) {
        throw new Error('Không thể cập nhật người dùng');
    }

    return user;
}

export const deleteUser = async (id: string) => {
    const user = await UserModel.findByIdAndDelete(id);

    if (!user) {
        throw new Error('Không thể xóa người dùng');
    }

    return { message: 'Xóa người dùng thành công' };
}

export const updateCurrentUserProfile = async (userId: string, updates: Partial<User>) => {
    const allowedUpdates = ['displayName', 'avatar', 'bio'];
    const filteredUpdates: any = {};

    for (const key of allowedUpdates) {
        if (updates[key as keyof User] !== undefined) {
            filteredUpdates[key] = updates[key as keyof User];
        }
    }

    const user = await UserModel.findByIdAndUpdate(userId, filteredUpdates, { new: true }).select('-password');

    if (!user) {
        throw new Error('Không thể cập nhật hồ sơ');
    }

    // Xóa cache để lần đọc tiếp theo lấy dữ liệu mới
    await delCache(`cache:user:${userId}`);

    return user;
};

export const updateUserStatus = async (userId: string, status: 'online' | 'offline' | 'away' | 'busy') => {
    const user = await UserModel.findByIdAndUpdate(
        userId,
        { status, lastSeen: new Date() },
        { new: true }
    ).select('-password');

    if (!user) {
        throw new Error('Không thể cập nhật trạng thái');
    }

    return user;
};

export const searchUsers = async (query: string, userId: string, limit: number = 20): Promise<User[]> => {
    if (!query || query.trim().length === 0) {
        throw new Error('Vui lòng nhập từ khóa tìm kiếm');
    }

    const users = await UserModel.find({
        _id: { $ne: userId },
        isActive: true,
        $or: [
            { displayName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ]
    })
        .select('-password')
        .limit(limit);

    return users;
};
