import UserModel, { User } from "../models/User"

export const createUser = async(data: User): Promise<Object> => {
   const checked =  await UserModel.findOne({ email: data.email })
    
    if (checked) {
        throw new Error('Email has existed already');
    }

    const user = await UserModel.create(data);

    return {
        userId: user._id,
        message: 'User created successfully',
    };
}

export const getUsers = async(page?: string, limit?: string, sortBy?: string): Promise<User[]> => {
    const pagination = page? Number(page): 1;
    const limitation = limit? Number(limit): 10;
    const skip =  (pagination - 1) * limitation;
    const sort = sortBy ?? 'createdAt';

    const users = await UserModel.find().select('-password -updatedAt -deletedAt').skip(skip).limit(limitation).sort(sort);
    
    if (users.length === 0) {
        throw new Error('Can not find any user')
    }

    return users;
}

export const getUserById = async(id: string): Promise<User> => {
    const user = await UserModel.findOne({_id: id}).select('-password -createdAt -updatedAt -deletedAt');
    
    if (!user) {
        throw new Error('Can not find user')
    }

    return user;
}


export const updateUser = async (id: string, data: User) => {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });
    
    if (!user) {
        throw new Error('Can not update user');
    }

    return user;
}

export const deleteUser = async (id: string) => {
    const user = await UserModel.findByIdAndDelete(id);
    
    if (!user) {
        throw new Error('Can not update user');
    }

    return { message: 'User deleted successfully' };
}