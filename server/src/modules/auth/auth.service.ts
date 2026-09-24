import { prisma } from '../../shared/prisma';
import { hashPassword, comparePassword } from '../../shared/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../../shared/jwt';
import { z } from 'zod';
import { RegisterSchema, LoginSchema } from './auth.schema';

type RegisterInput = z.infer<typeof RegisterSchema>;
type LoginInput = z.infer<typeof LoginSchema>;

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw { status: 409, code: 'USER_EXISTS', message: 'User with this email already exists' };
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        ...(input.role === 'SELLER' && input.storeName
          ? {
              sellerProfile: {
                create: {
                  storeName: input.storeName
                }
              }
            }
          : {})
      },
      include: {
        sellerProfile: true
      }
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sellerId: user.sellerProfile?.id
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sellerId: user.sellerProfile?.id
      },
      accessToken,
      refreshToken
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { sellerProfile: true }
    });

    if (!user) {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);

    if (!isMatch) {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sellerId: user.sellerProfile?.id
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sellerId: user.sellerProfile?.id
      },
      accessToken,
      refreshToken
    };
  }

  static async refresh(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      const accessToken = generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sellerId: decoded.sellerId
      });
      return { accessToken };
    } catch (err) {
      throw { status: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' };
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        sellerProfile: true
      }
    });

    if (!user) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return user;
  }
}
