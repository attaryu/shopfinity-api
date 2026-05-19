import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadPaymentProofDto {
  @ApiProperty({
    example: 'orders/payment-proofs/uuid-1234.jpg',
    description: 'Storage path of the payment proof file (returned by the upload-url endpoint)',
  })
  @IsString()
  @IsNotEmpty()
  path: string;
}
