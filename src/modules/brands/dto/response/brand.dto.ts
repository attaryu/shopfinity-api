import { ApiProperty } from '@nestjs/swagger';

export class BrandDto {
  @ApiProperty({ example: 1, description: 'The ID of the brand' })
  id: number;

  @ApiProperty({ example: 'Apple', description: 'The name of the brand' })
  name: string;

  @ApiProperty({ example: 'apple', description: 'The slug of the brand' })
  slug: string;

  @ApiProperty({
    example: 'brand/apple-logo.png',
    description: 'The path of the brand logo in storage',
  })
  logoUrl: string;

  @ApiProperty({
    example: 10,
    description: 'Number of products associated with this brand',
  })
  productCount?: number;
}
