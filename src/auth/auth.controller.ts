import type { Response } from 'express';

import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ControllerResponse } from 'src/common/types/controller-response';
import { UserProfileResponseDto } from 'src/users/dto/user-profile-response.dto';
import { AuthService } from './auth.service';
import { User } from './decorators/user.decorator';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns access token in response body and sets refresh token in HTTP-only cookie.',
  })
  @ApiOkResponse({
    description: 'User successfully authenticated',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data (validation failed)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['email must be an email', 'password should not be empty'],
        },
        data: { type: 'null', example: null },
        error: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'BadRequestException' },
            details: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2024-03-20T10:00:00Z' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        data: { type: 'null', example: null },
        error: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'UnauthorizedException' },
            details: { type: 'string', example: 'Invalid credentials' },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2024-03-20T10:00:00Z' },
          },
        },
      },
    },
  })
  async login(
    @User() user: UserProfileResponseDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse> {
    const result = await this.authService.login(user);

    const refreshTokenExpiration = process.env.JWT_REFRESH_DURATION;
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiration
        ? parseInt(refreshTokenExpiration, 10)
        : 7 * 24 * 60 * 60 * 1000, // Default to 7 days
    });

    return {
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }
}
