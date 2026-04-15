import { ApiProperty } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
  })
  fullname: string;

  @ApiProperty({
    example: 'USER',
    description: 'The role of the user',
    enum: ['USER', 'ADMIN'],
  })
  role: string;
}

export class LoginDataDto {
  @ApiProperty({
    type: UserDataDto,
    description: 'The authenticated user data',
  })
  user: UserDataDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;
}

export class MetaDto {
  @ApiProperty({
    example: '2024-03-20T10:00:00Z',
    description: 'Timestamp of the response',
  })
  timestamp: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Login successful',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: LoginDataDto,
    description: 'Response data containing user and access token',
  })
  data: LoginDataDto;

  @ApiProperty({
    example: null,
    description: 'Error details (null if successful)',
    nullable: true,
  })
  error?: any;

  @ApiProperty({
    type: MetaDto,
    description: 'Metadata including timestamp',
  })
  meta: MetaDto;
}
