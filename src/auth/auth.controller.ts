import type { Request, Response } from 'express';

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ControllerResponse } from 'src/common/types/controller-response';
import type { User } from 'src/users/types/user';
import { AuthService } from './auth.service';
import { User as UserDecorator } from './decorators/user.decorator';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { SignUpRequestDto } from './dto/request/sign-up-request.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { SignupResponseDto } from './dto/response/signup-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with email, fullname, and password. The password will be securely hashed before storage.',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: SignupResponseDto,
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
          example: [
            'email must be an email',
            'fullname must be longer than or equal to 2 characters',
            'password must be longer than or equal to 6 characters',
          ],
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
  @ApiConflictResponse({
    description: 'Email already registered',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email already registered' },
        data: { type: 'null', example: null },
        error: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'ConflictException' },
            details: { type: 'string', example: 'Email already registered' },
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
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Failed to create user' },
        data: { type: 'null', example: null },
        error: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              example: 'InternalServerErrorException',
            },
            details: { type: 'string', example: 'Failed to create user' },
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
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns access token in response body and sets refresh token in HTTP-only cookie.',
  })
  @ApiBody({
    type: LoginRequestDto,
    description: 'User credentials for authentication',
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
    @UserDecorator() user: User,
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

  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'User logout',
    description:
      'Logout user by clearing refresh token from database and removing cookie. Requires valid JWT access token.',
  })
  @ApiOkResponse({
    description: 'User successfully logged out',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Logout successful' },
        data: { type: 'null', example: null },
        error: { type: 'null', example: null },
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
    description: 'Invalid or missing token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        data: { type: 'null', example: null },
        error: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'UnauthorizedException' },
            details: { type: 'string', example: 'Unauthorized' },
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
  async logout(
    @UserDecorator() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ControllerResponse> {
    await this.authService.logout(user.id);

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logout successful' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generate a new access token using the refresh token stored in HTTP-only cookie. Implements refresh token rotation for enhanced security - the old refresh token is invalidated and a new one is issued.',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Token refreshed successfully' },
        data: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: 'e81705aa-f97e-4483-84bb-0874efac878a',
                },
                email: { type: 'string', example: 'user@shopfinity.com' },
                fullname: { type: 'string', example: 'Test User' },
                role: { type: 'string', example: 'USER' },
              },
            },
          },
        },
        error: { type: 'null', example: null },
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
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        data: { type: 'null', example: null },
        error: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'UnauthorizedException' },
            details: {
              type: 'string',
              example: 'Invalid or expired refresh token',
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

    // Set new refresh token in cookie (rotation)
    const refreshTokenExpiration = process.env.JWT_REFRESH_DURATION;
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiration
        ? parseInt(refreshTokenExpiration, 10)
        : 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }
}
