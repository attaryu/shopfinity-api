import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class CategoryListDataDto {
  @ApiProperty({
    type: [CategoryDto],
    description: 'List of categories',
  })
  categories: CategoryDto[];
}

export class CategoryListMetaDto {
  @ApiProperty({
    example: '2024-04-15T12:00:00.000Z',
    description: 'Timestamp of the response',
  })
  timestamp: string;

  @ApiProperty({
    example: 100,
    description: 'Total number of items available',
  })
  totalItems: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items in the current page',
  })
  itemCount: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  itemsPerPage: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of pages',
  })
  totalPages: number;

  @ApiProperty({
    example: 1,
    description: 'The current page number',
  })
  currentPage: number;
}

export class CategoryListResponseDto {
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
    example: 'Categories retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: CategoryListDataDto,
    description: 'Response data containing categories',
  })
  data: CategoryListDataDto;

  @ApiProperty({
    example: null,
    description: 'Error details (null if successful)',
    nullable: true,
  })
  error: any;

  @ApiProperty({
    type: CategoryListMetaDto,
    description: 'Pagination metadata',
  })
  meta: CategoryListMetaDto;
}
