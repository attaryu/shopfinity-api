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
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email already registered',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email already registered' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Failed to create user' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async signup(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.signup(createUserDto);

    return {
      message: 'User created successfully',
      data: { user },
    };
  }
}
