import { applyDecorators, HttpStatus } from '@nestjs/common';
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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { LoginRequestDto } from '../../modules/auth/dto/request/login-request.dto';
import { LoginResponseDto } from '../../modules/auth/dto/response/login-response.dto';
import { SignupResponseDto } from '../../modules/auth/dto/response/signup-response.dto';

export function ApiSignupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Create a new user account with email, fullname, and password. The password will be securely hashed before storage.',
    }),
    ApiCreatedResponse({
      description: 'User successfully registered',
      type: SignupResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid input data (validation failed)',
    }),
    ApiConflictResponse({ description: 'Email already registered' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
}

export function ApiLoginDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description:
        'Authenticate user with email and password. Returns access token in response body and sets refresh token in HTTP-only cookie.',
    }),
    ApiBody({ type: LoginRequestDto, description: 'User credentials for authentication' }),
    ApiOkResponse({ description: 'User successfully authenticated', type: LoginResponseDto }),
    ApiBadRequestResponse({ description: 'Invalid input data (validation failed)' }),
    ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
  );
}

export function ApiLogoutDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'User logout',
      description:
        'Logout user by clearing refresh token from database and removing cookie. Requires valid JWT access token.',
    }),
    ApiOkResponse({ description: 'User successfully logged out' }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing token' }),
  );
}

export function ApiRefreshDocs() {
  return applyDecorators(
    ApiCookieAuth('refreshToken'),
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Generate a new access token using the refresh token stored in HTTP-only cookie. Implements refresh token rotation for enhanced security.',
    }),
    ApiOkResponse({ description: 'Tokens refreshed successfully' }),
    ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' }),
  );
}
