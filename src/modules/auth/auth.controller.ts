import type { Request, Response } from 'express';

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

import {
  ApiLoginDocs,
  ApiLogoutDocs,
  ApiRefreshDocs,
  ApiSignupDocs,
} from '../../common/decorators/auth-swagger.decorator';
import { User as UserDecorator } from '../../common/decorators/user.decorator';
import { ControllerResponse } from '../../common/types/controller-response';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../core/guards/local-auth.guard';
import type { User } from '../../modules/users/types/user';
import { AuthService } from './auth.service';
import { SignUpRequestDto } from './dto/request/sign-up-request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private setCookies(response: Response, refreshToken: string) {
    const refreshTokenExpiration = this.configService.get<number>(
      'JWT_REFRESH_DURATION',
    );
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiration ?? 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiSignupDocs()
  async signup(
    @Body() signUpDto: SignUpRequestDto,
  ): Promise<ControllerResponse> {
    return {
      message: 'User created successfully',
      data: {
        user: await this.authService.signup(signUpDto),
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiLoginDocs()
  async login(
    @UserDecorator() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse> {
    const result = await this.authService.login(user);

    this.setCookies(response, result.refreshToken);

    return {
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiLogoutDocs()
  async logout(
    @UserDecorator() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse> {
    await this.authService.logout(user.id);

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logout successful' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshDocs()
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const refreshToken = request.cookies['refreshToken'] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshToken(refreshToken);

    this.setCookies(response, result.refreshToken);

    return {
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }
}
