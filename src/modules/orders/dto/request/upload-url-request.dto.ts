import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadUrlRequestDto {
  @ApiProperty({
    example: 'payment-proof.jpg',
    description: 'Original filename of the payment proof image',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;
}
