import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserProfileResponseDto } from 'src/users/dto/user-profile-response.dto';
import { UsersService } from '../users/users.service';
import { TokenPayload } from './types/token-payload';

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

    const { password: hashedPassword, ...result } = user;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return null;
    }

    return result;
  }

  async login(user: UserProfileResponseDto) {
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
}
