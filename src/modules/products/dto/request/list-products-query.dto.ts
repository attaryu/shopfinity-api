import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListProductsQueryDto {
  @ApiPropertyOptional({ description: 'Search term for product name or slug' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID', type: String })
  @IsOptional()
  @IsString()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by brand ID', type: String })
  @IsOptional()
  @IsString()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Field to sort by', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
