import { ApiProperty } from '@nestjs/swagger';
import { BrandDto } from './brand.dto';

export class BrandListDataDto {
  @ApiProperty({
    type: [BrandDto],
    description: 'List of brands',
  })
  brands: BrandDto[];
}

export class BrandListMetaDto {
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

export class BrandListResponseDto {
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
    example: 'Brands retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: BrandListDataDto,
    description: 'Response data containing brands',
  })
  data: BrandListDataDto;

  @ApiProperty({
    example: null,
    description: 'Error details (null if successful)',
    nullable: true,
  })
  error: any;

  @ApiProperty({
    type: BrandListMetaDto,
    description: 'Pagination metadata',
  })
  meta: BrandListMetaDto;
}
