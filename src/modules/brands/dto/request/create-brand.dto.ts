import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Apple',
    description: 'The name of the brand',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'apple',
    description: 'The slug for the brand URL',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    example: 'brand/apple-logo.png',
    description:
      'The path of the brand logo in storage (excluding domain). This path is obtained from the client-side upload to storage.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  logoUrl: string;
}
