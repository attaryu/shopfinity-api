import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Put,
  HttpStatus,
  HttpCode,
  Query,
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';

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
  @ApiOperation({ summary: 'List all categories with pagination, search, and sort' })
  @ApiOkResponse({ description: 'Categories retrieved successfully' })
  async findAll(
    @Query() query: ListCategoriesQueryDto,
  ): Promise<ControllerResponse> {
    const result = await this.categoriesService.findAllPaginated(query);
    return {
      message: 'Categories retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiOkResponse({ description: 'Category retrieved successfully' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ControllerResponse> {
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
    @Param('id', ParseIntPipe) id: number,
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
    @Param('id', ParseIntPipe) id: number,
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
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ControllerResponse> {
    await this.categoriesService.remove(id);
    return {
      message: 'Category deleted successfully',
    };
  }
}
