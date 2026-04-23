import { ApiProperty } from '@nestjs/swagger';

export class DashboardTotalDto {
  @ApiProperty({ example: 10, description: 'Total number of products' })
  product: number;

  @ApiProperty({ example: 5, description: 'Total number of categories' })
  category: number;

  @ApiProperty({ example: 8, description: 'Total number of brands' })
  brand: number;
}

export class LowStockProductDto {
  @ApiProperty({ example: '445c0193-70bf-4cf7-bf81-e0ae23b09a18', description: 'Product ID' })
  id: string;

  @ApiProperty({ example: 'Streetwear Be Valuable AABAA', description: 'Product name' })
  name: string;

  @ApiProperty({ example: 'streetwear-be-valuable-aabaa', description: 'Product slug' })
  slug: string;

  @ApiProperty({ example: 3, description: 'Current stock level' })
  stock: number;

  @ApiProperty({ example: 'products/images/86bb6c4d.jpg', description: 'Product image URL path' })
  imageUrl: string;
}

export class DashboardStatsDataDto {
  @ApiProperty({ type: DashboardTotalDto, description: 'Total counts for each entity' })
  total: DashboardTotalDto;

  @ApiProperty({ example: 1500, description: 'Total sum of stock for all products' })
  allStock: number;

  @ApiProperty({ example: 75.5, description: 'Average stock across all products' })
  productStockAverate: number;

  @ApiProperty({ type: [LowStockProductDto], description: 'List of products with stock below 5' })
  lowStockProducts: LowStockProductDto[];
}

export class DashboardStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Dashboard statistics retrieved successfully' })
  message: string;

  @ApiProperty({ type: DashboardStatsDataDto })
  data: DashboardStatsDataDto;

  @ApiProperty({ example: null, nullable: true })
  error: any;

  @ApiProperty({
    example: { timestamp: '2024-04-15T12:00:00.000Z' },
  })
  meta: any;
}
