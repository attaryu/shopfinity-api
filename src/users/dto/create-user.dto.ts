import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
    minLength: 2,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullname: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'The password for the user account (minimum 6 characters)',
    minLength: 6,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
