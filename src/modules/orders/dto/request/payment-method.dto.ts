import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PaymentMethodDto {
  @ApiProperty({ example: 'bca' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: ['qris', 'bank_transfer'] })
  @IsIn(['qris', 'bank_transfer'])
  type: 'qris' | 'bank_transfer';

  @ApiProperty({ example: 'Bank BCA' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '1234567890', nullable: true })
  @IsOptional()
  @IsString()
  accountNumber: string | null;

  @ApiPropertyOptional({ example: 'Shopfinity', nullable: true })
  @IsOptional()
  @IsString()
  accountName: string | null;
}
