import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlDataDto {
  @ApiProperty({
    example: 'https://xxx.supabase.co/storage/v1/s3/signed-url',
    description: 'The signed URL to upload the file to',
  })
  signUrl: string;

  @ApiProperty({
    example: 'products/images/filename.png',
    description: 'The path where the file will be stored',
  })
  path: string;

  @ApiProperty({
    example: 'xxx.yyy.zzz',
    description: 'The upload token for authorization',
  })
  token: string;
}

export class UploadUrlResponseDto {
  @ApiProperty({ example: 'Signed URL generated successfully' })
  message: string;

  @ApiProperty({ type: UploadUrlDataDto })
  data: UploadUrlDataDto;
}
