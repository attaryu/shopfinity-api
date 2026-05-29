import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlDataDto {
  @ApiProperty({
    example: 'https://shopfinity.s3.ap-southeast-1.amazonaws.com/brands/logos/filename.png?...',
    description: 'The signed URL to upload the file to',
  })
  signUrl: string;

  @ApiProperty({
    example: 'brands/logos/filename.png',
    description: 'The path where the file will be stored',
  })
  path: string;
}

export class UploadUrlResponseDto {
  @ApiProperty({ example: 'Signed URL generated successfully' })
  message: string;

  @ApiProperty({ type: UploadUrlDataDto })
  data: UploadUrlDataDto;
}
