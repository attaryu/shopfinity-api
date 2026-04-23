import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { ControllerResponse } from 'src/common/types/controller-response';
import { UsersService } from './users.service';
import type { User as UserType } from './types/user';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user information',
    description:
      'Retrieve the profile information of the currently authenticated user. Requires valid JWT access token.',
  })
  @ApiOkResponse({
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'User information retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
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
  async getMe(@User() user: UserType): Promise<ControllerResponse> {
    const userInfo = await this.usersService.findById(user.id);

    return {
      message: 'User information retrieved successfully',
      data: {
        user: userInfo,
      },
    };
  }
}
