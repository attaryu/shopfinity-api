import { Injectable, NotFoundException } from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import { CreateBrandDto } from './dto/request/create-brand.dto';
import { ListBrandsQueryDto } from './dto/request/list-brands-query.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepository: BrandsRepository) {}

  async create(createBrandDto: CreateBrandDto) {
    return this.brandsRepository.create(createBrandDto);
  }

  async findAllPaginated(query: ListBrandsQueryDto) {
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

    const [brands, totalItems] = await Promise.all([
      this.brandsRepository.findPaginated({
        skip,
        take,
        where,
        orderBy: { [sortBy || 'id']: sortOrder || 'asc' },
      }),
      this.brandsRepository.countAll(where),
    ]);

    const transformedBrands = brands.map((brand: any) => ({
      ...brand,
      productCount: brand._count.products,
      _count: undefined,
    }));

    return {
      brands: transformedBrands,
      meta: {
        timestamp: new Date().toISOString(),
        totalItems,
        itemCount: brands.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: number) {
    const brand = await this.brandsRepository.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }
}
