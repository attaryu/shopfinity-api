import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { SignUpRequestDto } from '../auth/dto/request/sign-up-request.dto';
import { PrismaProvider } from '../common/providers/prisma.provider';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaProvider) {}

  async create(createUserDto: SignUpRequestDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          fullname: createUserDto.fullname,
          password: createUserDto.password,
        },
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
        },
      });

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async storeRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
    });
  }

  async clearRefreshToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
      },
    });
  }

  async findByIdWithRefreshToken(userId: string): Promise<{
    id: string;
    email: string;
    fullname: string;
    role: string;
    refreshToken: string | null;
  } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        refreshToken: true,
      },
    });
  }
}
