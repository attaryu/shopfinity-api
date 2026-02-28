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

export class SignupDataDto {
  @ApiProperty({
    type: UserDataDto,
    description: 'The created user data',
  })
  user: UserDataDto;
}

export class SignupResponseDto {
  @ApiProperty({
    example: 'User created successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SignupDataDto,
    description: 'Response data containing user information',
  })
  data: SignupDataDto;
}
