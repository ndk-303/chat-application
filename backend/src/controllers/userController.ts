import { Request, Response } from "express";
import * as userService from '../services/userService'

export const creatUser = async (req: Request, res: Response) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({message: error.message})
    }
}

export const getUsers = async (_: Request, res: Response) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(400).json({message: error.message})
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id[0]);
    res.json(user);
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

export const updateUser = async(req: Request, res: Response) => {
  try {
    await userService.updateUser(req.params.id[0], req.body);
    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id[0]);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(404).json({ message: error.message});
  }
};