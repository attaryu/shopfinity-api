import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ControllerResponse } from '../../common/types/controller-response';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import { ListCategoriesQueryDto } from './dto/request/list-categories-query.dto';
import { CategoryListResponseDto } from './dto/response/category-list-response.dto';
import { SingleCategoryResponseDto } from './dto/response/single-category-response.dto';
import { CategoryListSimpleResponseDto } from './dto/response/category-list-simple-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiCreatedResponse({ description: 'Category created successfully' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ControllerResponse> {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      message: 'Category created successfully',
      data: { category },
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List all categories with pagination, search, and sort',
  })
  @ApiOkResponse({
    description: 'Categories retrieved successfully',
    type: CategoryListResponseDto,
  })
  async findAll(
    @Query() query: ListCategoriesQueryDto,
  ): Promise<ControllerResponse> {
    const result = await this.categoriesService.findAllPaginated(query);
    return {
      message: 'Categories retrieved successfully',
      data: { categories: result.categories },
      meta: result.meta,
    };
  }

  @Get('list')
  @ApiOperation({
    summary: 'List all categories with only ID and name (no pagination)',
  })
  @ApiOkResponse({
    description: 'Categories list retrieved successfully',
    type: CategoryListSimpleResponseDto,
  })
  async listAll(): Promise<ControllerResponse> {
    const categories = await this.categoriesService.findAllList();
    return {
      message: 'Categories list retrieved successfully',
      data: { categories },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiOkResponse({
    description: 'Category retrieved successfully',
    type: SingleCategoryResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<ControllerResponse> {
    const category = await this.categoriesService.findById(id);
    return {
      message: 'Category retrieved successfully',
      data: { category },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiOkResponse({ description: 'Category updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: CreateCategoryDto, // Using CreateCategoryDto for PUT completeness
  ): Promise<ControllerResponse> {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return {
      message: 'Category updated successfully',
      data: { category },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partially update a category (Admin only)' })
  @ApiOkResponse({ description: 'Category partially updated successfully' })
  async partialUpdate(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ControllerResponse> {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return {
      message: 'Category partially updated successfully',
      data: { category },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  @ApiOkResponse({ description: 'Category deleted successfully' })
  async remove(@Param('id') id: string): Promise<ControllerResponse> {
    await this.categoriesService.remove(id);
    return {
      message: 'Category deleted successfully',
    };
  }
}
