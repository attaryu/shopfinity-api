import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaStorageProvider } from 'src/common/providers/media-storage.provider';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/request/create-product.dto';
import { UpdateProductDto } from './dto/request/update-product.dto';
import { ListProductsQueryDto } from './dto/request/list-products-query.dto';
import { UploadUrlRequestDto } from './dto/request/upload-url-request.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly mediaStorage: MediaStorageProvider,
  ) {}

  async generateUploadUrl(uploadUrlRequestDto: UploadUrlRequestDto) {
    const { fileName } = uploadUrlRequestDto;
    const randomId = crypto.randomUUID();
    const path = `products/images/${randomId}-${fileName}`;

    return this.mediaStorage.generateSignedUploadUrl(path);
  }

  async create(createProductDto: CreateProductDto) {
    return this.productsRepository.create(createProductDto);
  }

  async findAllPaginated(query: ListProductsQueryDto) {
    const {
      search,
      categoryId,
      brandId,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
    } = query;

    const where: any = { AND: [] };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (categoryId) {
      where.AND.push({ categoryId });
    }

    if (brandId) {
      where.AND.push({ brandId });
    }

    // If no filters applied, simplify the where object
    const finalWhere = where.AND.length > 0 ? where : {};

    const skip = (page - 1) * limit;
    const take = limit;

    const [products, totalItems] = await Promise.all([
      this.productsRepository.findPaginated({
        skip,
        take,
        where: finalWhere,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'asc' },
      }),
      this.productsRepository.countAll(finalWhere),
    ]);

    return {
      products,
      meta: {
        timestamp: new Date().toISOString(),
        totalItems,
        itemCount: products.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string) {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findById(id); // Check existence
    return this.productsRepository.update(id, updateProductDto);
  }

  async remove(id: string) {
    await this.findById(id); // Check existence
    return this.productsRepository.delete(id);
  }
}
