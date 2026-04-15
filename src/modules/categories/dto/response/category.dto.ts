import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the category',
  })
  id: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the category',
  })
  name: string;

  @ApiProperty({
    example: 'electronics',
    description: 'The URL slug of the category',
  })
  slug: string;

  @ApiProperty({
    example: '2024-04-15T12:00:00.000Z',
    description: 'The date the category was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-04-15T12:00:00.000Z',
    description: 'The date the category was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: 5,
    description: 'The number of products in this category',
    required: false,
  })
  productCount?: number;
}
