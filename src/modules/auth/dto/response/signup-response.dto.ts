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

export class SignupDataWrapperDto {
  @ApiProperty({
    type: UserDataDto,
    description: 'The created user data',
  })
  user: UserDataDto;
}

export class MetaDto {
  @ApiProperty({
    example: '2024-03-20T10:00:00Z',
    description: 'Timestamp of the response',
  })
  timestamp: string;
}

export class SignupResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 201,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'User created successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SignupDataWrapperDto,
    description: 'Response data containing user information',
  })
  data: SignupDataWrapperDto;

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
