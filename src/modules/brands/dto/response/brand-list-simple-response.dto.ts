import { ApiProperty } from '@nestjs/swagger';

export class SimpleBrandDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The unique identifier of the brand',
  })
  id: string;

  @ApiProperty({
    example: 'Apple',
    description: 'The name of the brand',
  })
  name: string;
}

export class BrandListSimpleDataDto {
  @ApiProperty({
    type: [SimpleBrandDto],
    description: 'List of brands',
  })
  brands: SimpleBrandDto[];
}

export class BrandListSimpleResponseDto {
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
    example: 'Brands list retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: BrandListSimpleDataDto,
    description: 'Response data containing brands',
  })
  data: BrandListSimpleDataDto;

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
