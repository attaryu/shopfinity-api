import { ApiProperty } from '@nestjs/swagger';
import { BrandDto } from './brand.dto';

export class SingleBrandDataDto {
  @ApiProperty({
    type: BrandDto,
    description: 'The brand details',
  })
  brand: BrandDto;
}

export class SingleBrandResponseDto {
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
    example: 'Brand retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SingleBrandDataDto,
    description: 'Response data containing the brand',
  })
  data: SingleBrandDataDto;

  @ApiProperty({
    example: null,
    description: 'Error details (null if successful)',
    nullable: true,
  })
  error: any;
}
