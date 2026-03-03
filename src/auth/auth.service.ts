import type { TokenPayload } from './types/token-payload';

import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from 'src/users/types/user';
import { UsersService } from '../users/users.service';
import { SignUpRequestDto } from './dto/request/sign-up-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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

    return this.usersService.create({
      ...signUpDto,
      password: await bcrypt.hash(signUpDto.password, 10),
    });
  }

  async login(user: Omit<User, 'password' | 'refreshToken'>) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync<TokenPayload>(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'default-secret',
      expiresIn:
        (process.env.JWT_ACCESS_EXPIRATION as unknown as number) ?? '15m',
    });

    const refreshToken = await this.jwtService.signAsync<TokenPayload>(
      payload,
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'default-refresh-secret',
        expiresIn:
          (process.env.JWT_REFRESH_EXPIRATION as unknown as number) ?? '7d',
      },
    );

    await this.usersService.storeRefreshToken(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    return this.usersService.clearRefreshToken(userId);
  }
}
