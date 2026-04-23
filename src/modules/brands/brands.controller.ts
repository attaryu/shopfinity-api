import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { ControllerResponse } from '../../common/types/controller-response';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/request/create-brand.dto';
import { ListBrandsQueryDto } from './dto/request/list-brands-query.dto';
import { UpdateBrandDto } from './dto/request/update-brand.dto';
import { UploadUrlRequestDto } from './dto/request/upload-url-request.dto';
import { BrandListResponseDto } from './dto/response/brand-list-response.dto';
import { BrandListSimpleResponseDto } from './dto/response/brand-list-simple-response.dto';
import { SingleBrandResponseDto } from './dto/response/single-brand-response.dto';
import { UploadUrlResponseDto } from './dto/response/upload-url-response.dto';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post('upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a signed URL for uploading a file (Admin only)',
  })
  @ApiOkResponse({
    description: 'Signed URL generated successfully',
    type: UploadUrlResponseDto,
  })
  async getUploadUrl(
    @Body() uploadUrlRequestDto: UploadUrlRequestDto,
  ): Promise<ControllerResponse> {
    const data =
      await this.brandsService.generateUploadUrl(uploadUrlRequestDto);
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
  @ApiOperation({ summary: 'Create a new brand (Admin only)' })
  @ApiCreatedResponse({ description: 'Brand created successfully' })
  async create(
    @Body() createBrandDto: CreateBrandDto,
  ): Promise<ControllerResponse> {
    const brand = await this.brandsService.create(createBrandDto);
    return {
      message: 'Brand created successfully',
      data: { brand },
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List all brands with pagination, search, and sort',
  })
  @ApiOkResponse({
    description: 'Brands retrieved successfully',
    type: BrandListResponseDto,
  })
  async findAll(
    @Query() query: ListBrandsQueryDto,
  ): Promise<ControllerResponse> {
    const result = await this.brandsService.findAllPaginated(query);
    return {
      message: 'Brands retrieved successfully',
      data: { brands: result.brands },
      meta: result.meta,
    };
  }

  @Get('list')
  @ApiOperation({
    summary: 'List all brands with only ID and name (no pagination)',
  })
  @ApiOkResponse({
    description: 'Brands list retrieved successfully',
    type: BrandListSimpleResponseDto,
  })
  async listAll(): Promise<ControllerResponse> {
    const brands = await this.brandsService.findAllList();
    return {
      message: 'Brands list retrieved successfully',
      data: { brands },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  @ApiOkResponse({
    description: 'Brand retrieved successfully',
    type: SingleBrandResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<ControllerResponse> {
    const brand = await this.brandsService.findById(id);
    return {
      message: 'Brand retrieved successfully',
      data: { brand },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand (Admin only)' })
  @ApiOkResponse({ description: 'Brand updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: CreateBrandDto, // Using CreateBrandDto for PUT completeness
  ): Promise<ControllerResponse> {
    const brand = await this.brandsService.update(id, updateBrandDto);
    return {
      message: 'Brand updated successfully',
      data: { brand },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partially update a brand (Admin only)' })
  @ApiOkResponse({ description: 'Brand partially updated successfully' })
  async partialUpdate(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ): Promise<ControllerResponse> {
    const brand = await this.brandsService.update(id, updateBrandDto);
    return {
      message: 'Brand partially updated successfully',
      data: { brand },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a brand (Admin only)' })
  @ApiOkResponse({ description: 'Brand deleted successfully' })
  async remove(@Param('id') id: string): Promise<ControllerResponse> {
    await this.brandsService.remove(id);
    return {
      message: 'Brand deleted successfully',
    };
  }
}
