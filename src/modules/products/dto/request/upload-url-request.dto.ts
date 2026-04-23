import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class UploadUrlRequestDto {
  @ApiProperty({
    example: 'product-image.png',
    description: 'The name of the file to be uploaded',
  })
  @IsString()
  @IsNotEmpty()
  fileName?: string;

  @ApiProperty({
    example: 'image/png',
    description: 'The MIME type of the file',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['image/png', 'image/jpeg', 'image/avif', 'image/webp'])
  fileType?: string;
}
