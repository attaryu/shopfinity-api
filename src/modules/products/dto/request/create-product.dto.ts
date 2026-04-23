import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'iPhone 15 Pro',
    description: 'The name of the product',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'iphone-15-pro',
    description: 'The slug for the product URL',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    example: 'The latest iPhone with titanium design',
    description: 'Detailed description of the product',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 999.99,
    description: 'Price of the product',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Stock quantity available',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    example: 'products/iphone-15.png',
    description: 'The path of the product image in storage',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The ID of the category this product belongs to',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The ID of the brand this product belongs to',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  brandId: string;
}
