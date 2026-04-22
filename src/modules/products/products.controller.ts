import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Get,
  Query,
  Param,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ControllerResponse } from 'src/common/types/controller-response';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/request/create-product.dto';
import { UpdateProductDto } from './dto/request/update-product.dto';
import { ListProductsQueryDto } from './dto/request/list-products-query.dto';
import { UploadUrlRequestDto } from './dto/request/upload-url-request.dto';
import { ClientListProductsQueryDto } from './dto/request/client-list-products-query.dto';
import { UploadUrlResponseDto } from './dto/response/upload-url-response.dto';
import { ClientProductListResponseDto } from './dto/response/client-product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a signed URL for uploading a product image (Admin only)' })
  @ApiOkResponse({
    description: 'Signed URL generated successfully',
    type: UploadUrlResponseDto,
  })
  async getUploadUrl(
    @Body() uploadUrlRequestDto: UploadUrlRequestDto,
  ): Promise<ControllerResponse> {
    const data = await this.productsService.generateUploadUrl(uploadUrlRequestDto);
    return {
      message: 'Signed URL generated successfully',
      data,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiCreatedResponse({ description: 'Product created successfully' })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ControllerResponse> {
    const product = await this.productsService.create(createProductDto);
    return {
      message: 'Product created successfully',
      data: { product },
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List all products with pagination, search, and filters',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
  })
  async findAll(@Query() query: ListProductsQueryDto): Promise<ControllerResponse> {
    const result = await this.productsService.findAllPaginated(query);
    return {
      message: 'Products retrieved successfully',
      data: { products: result.products },
      meta: result.meta,
    };
  }

  @Get('client')
  @ApiOperation({
    summary: 'List products for client-side with specific filters and pagination',
  })
  @ApiOkResponse({
    description: 'Products retrieved successfully',
    type: ClientProductListResponseDto,
  })
  async findAllForClient(
    @Query() query: ClientListProductsQueryDto,
  ): Promise<ControllerResponse> {
    const result = await this.productsService.findAllForClients(query);
    return {
      message: 'Products retrieved successfully',
      data: { products: result.products },
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiOkResponse({
    description: 'Product retrieved successfully',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ControllerResponse> {
    const product = await this.productsService.findById(id);
    return {
      message: 'Product retrieved successfully',
      data: { product },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiOkResponse({ description: 'Product updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: CreateProductDto, // Using CreateProductDto for PUT completeness
  ): Promise<ControllerResponse> {
    const product = await this.productsService.update(id, updateProductDto);
    return {
      message: 'Product updated successfully',
      data: { product },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partially update a product (Admin only)' })
  @ApiOkResponse({ description: 'Product partially updated successfully' })
  async partialUpdate(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ControllerResponse> {
    const product = await this.productsService.update(id, updateProductDto);
    return {
      message: 'Product partially updated successfully',
      data: { product },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ApiOkResponse({ description: 'Product deleted successfully' })
  async remove(
    @Param('id') id: string,
  ): Promise<ControllerResponse> {
    await this.productsService.remove(id);
    return {
      message: 'Product deleted successfully',
    };
  }
}
