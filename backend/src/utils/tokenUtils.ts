import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
    role?: string;
}

export const generateAccessToken = (payload: any) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"],
});

export const generateRefreshToken = (payload: any) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES as jwt.SignOptions["expiresIn"],
});

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;
} 

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
} 


