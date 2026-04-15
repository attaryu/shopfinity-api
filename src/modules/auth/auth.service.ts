import type { TokenPayload } from './types/token-payload';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User } from 'src/modules/users/types/user';
import { UsersService } from '../users/users.service';
import { SignUpRequestDto } from './dto/request/sign-up-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    };
  }

  async signup(signUpDto: SignUpRequestDto) {
    const existingUser = await this.usersService.findByEmail(signUpDto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
    return this.usersService.create({
      email: signUpDto.email,
      fullname: signUpDto.fullname,
      password: hashedPassword,
    });
  }

  async login(user: Omit<User, 'password' | 'refreshToken'>) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync<TokenPayload>(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'default-secret',
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') ?? '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync<TokenPayload>(
      payload,
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'default-refresh-secret',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d') as any,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.storeRefreshToken(user.id, hashedRefreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    return this.usersService.clearRefreshToken(userId);
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        oldRefreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'default-refresh-secret',
        },
      );

      // Find user with refresh token
      const user = await this.usersService.findByIdWithRefreshToken(
        payload.sub,
      );

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify that the stored refresh token matches the provided one
      const isRefreshTokenValid = await bcrypt.compare(
        oldRefreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens (refresh token rotation)
      const newPayload: TokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = await this.jwtService.signAsync<TokenPayload>(
        newPayload,
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'default-secret',
          expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') ?? '15m') as any,
        },
      );

      const newRefreshToken = await this.jwtService.signAsync<TokenPayload>(
        newPayload,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'default-refresh-secret',
          expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d') as any,
        },
      );

      // Store new refresh token (rotation)
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.usersService.storeRefreshToken(user.id, hashedRefreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
        },
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
