import { ApiProperty } from '@nestjs/swagger';

class CategoryResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  slug?: string;
}

class BrandResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  slug?: string;

  @ApiProperty()
  logoUrl?: string;
}

export class ClientProductDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  slug?: string;

  @ApiProperty()
  imageUrl?: string;

  @ApiProperty()
  price?: number;

  @ApiProperty()
  category?: CategoryResponseDto;

  @ApiProperty()
  brand?: BrandResponseDto;
}

export class ClientProductListDataDto {
  @ApiProperty({ type: [ClientProductDto] })
  products?: ClientProductDto[];
}

export class ClientProductListMetaDto {
  @ApiProperty({ example: '2024-04-15T12:00:00.000Z' })
  timestamp?: string;

  @ApiProperty({ example: 100 })
  totalItems?: number;

  @ApiProperty({ example: 12 })
  itemCount?: number;

  @ApiProperty({ example: 12 })
  itemsPerPage?: number;

  @ApiProperty({ example: 12, nullable: true })
  nextOffset?: number | null;
}

export class ClientProductListResponseDto {
  @ApiProperty({ example: true })
  success?: boolean;

  @ApiProperty({ example: 200 })
  statusCode?: number;

  @ApiProperty({ example: 'Products retrieved successfully' })
  message?: string;

  @ApiProperty({ type: ClientProductListDataDto })
  data?: ClientProductListDataDto;

  @ApiProperty({ example: null, nullable: true })
  error: any;

  @ApiProperty({ type: ClientProductListMetaDto })
  meta?: ClientProductListMetaDto;
}
