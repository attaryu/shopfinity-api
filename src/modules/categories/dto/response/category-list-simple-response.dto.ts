import { ApiProperty } from '@nestjs/swagger';

export class SimpleCategoryDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The unique identifier of the category',
  })
  id: string;

  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the category',
  })
  name: string;
}

export class CategoryListSimpleDataDto {
  @ApiProperty({
    type: [SimpleCategoryDto],
    description: 'List of categories',
  })
  categories: SimpleCategoryDto[];
}

export class CategoryListSimpleResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Categories list retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: CategoryListSimpleDataDto,
    description: 'Response data containing categories',
  })
  data: CategoryListSimpleDataDto;

  @ApiProperty({
    example: null,
    description: 'Error details (null if successful)',
    nullable: true,
  })
  error: any;

  @ApiProperty({
    description: 'Response metadata',
  })
  meta: {
    timestamp: string;
  };
}
