import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'User A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Jl. Keputih No. 5' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Surabaya' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Jawa Timur' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: '60111' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}
