import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class SingleCategoryDataDto {
  @ApiProperty({
    type: CategoryDto,
    description: 'The category data',
  })
  category: CategoryDto;
}

export class SingleCategoryMetaDto {
  @ApiProperty({
    example: '2024-04-15T12:00:00.000Z',
    description: 'Timestamp of the response',
  })
  timestamp: string;
}

export class SingleCategoryResponseDto {
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
    example: 'Category retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SingleCategoryDataDto,
    description: 'Response data containing the category',
  })
  data: SingleCategoryDataDto;

  @ApiProperty({
    example: null,
    description: 'Error details (null if successful)',
    nullable: true,
  })
  error: any;

  @ApiProperty({
    type: SingleCategoryMetaDto,
    description: 'Response metadata',
  })
  meta: SingleCategoryMetaDto;
}
