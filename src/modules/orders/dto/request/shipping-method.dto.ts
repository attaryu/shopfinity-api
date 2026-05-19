import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ShippingMethodDto {
  @ApiProperty({ example: 'jne-reg' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'JNE' })
  @IsString()
  @IsNotEmpty()
  courier: string;

  @ApiProperty({ example: 'REG' })
  @IsString()
  @IsNotEmpty()
  service: string;

  @ApiProperty({ example: '2-3 days' })
  @IsString()
  @IsNotEmpty()
  estimatedDays: string;

  @ApiProperty({ example: 15000, description: 'Shipping cost in Rupiah' })
  @IsNumber()
  @Min(0)
  cost: number;
}
