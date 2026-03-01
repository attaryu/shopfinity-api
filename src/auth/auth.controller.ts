import type { Response } from 'express';

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
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
}
