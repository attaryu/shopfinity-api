import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import { ListCategoriesQueryDto } from './dto/request/list-categories-query.dto';

@Injectable()
export class CategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.categoriesRepository.create(createCategoryDto);
  }

  async findAllPaginated(query: ListCategoriesQueryDto) {
    const { search, sortBy, sortOrder, page = 1, limit = 10 } = query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;
    const take = limit;

    const [categories, totalItems] = await Promise.all([
      this.categoriesRepository.findPaginated({
        skip,
        take,
        where,
        orderBy: { [sortBy || 'id']: sortOrder || 'asc' },
      }),
      this.categoriesRepository.countAll(where),
    ]);

    const transformedCategories = categories.map((cat: any) => ({
      ...cat,
      productCount: cat._count.products,
      _count: undefined,
    }));

    return {
      categories: transformedCategories,
      meta: {
        totalItems,
        itemCount: categories.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findAll() {
    return this.categoriesRepository.findAll();
  }

  async findById(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findById(id); // Check existence
    return this.categoriesRepository.update(id, updateCategoryDto);
  }

  async remove(id: string) {
    await this.findById(id); // Check existence
    return this.categoriesRepository.delete(id);
  }
}
