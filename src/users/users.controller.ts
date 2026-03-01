import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto } from './dto/create-user.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  async signup(@Body() createUserDto: CreateUserDto) {
    return {
      message: 'User created successfully',
      data: await this.usersService.signup(createUserDto),
    };
  }
}
