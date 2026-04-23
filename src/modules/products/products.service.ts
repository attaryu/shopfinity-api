import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaStorageProvider } from 'src/common/providers/media-storage.provider';
import { ClientListProductsQueryDto } from './dto/request/client-list-products-query.dto';
import { CreateProductDto } from './dto/request/create-product.dto';
import { ListProductsQueryDto } from './dto/request/list-products-query.dto';
import { UpdateProductDto } from './dto/request/update-product.dto';
import { UploadUrlRequestDto } from './dto/request/upload-url-request.dto';
import { ProductsRepository } from './products.repository';

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
    const isImageExist = await this.mediaStorage.exists(
      createProductDto.imageUrl,
    );
    if (!isImageExist) {
      throw new BadRequestException(
        `Product image not found at path: ${createProductDto.imageUrl}`,
      );
    }
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

  async findAllForClients(query: ClientListProductsQueryDto) {
    const {
      search,
      brand,
      category,
      minPrice,
      maxPrice,
      nextOffset: offset = 0,
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

    if (brand) {
      where.AND.push({ brand: { slug: brand } });
    }

    if (category) {
      where.AND.push({ category: { slug: category } });
    }

    if (minPrice !== undefined) {
      where.AND.push({ price: { gte: minPrice } });
    }

    if (maxPrice !== undefined) {
      where.AND.push({ price: { lte: maxPrice } });
    }

    const finalWhere = where.AND.length > 0 ? where : {};
    const limit = 12;

    const [products, totalItems] = await Promise.all([
      this.productsRepository.findPaginated({
        skip: offset,
        take: limit,
        where: finalWhere,
        orderBy: { createdAt: 'desc' },
      }),
      this.productsRepository.countAll(finalWhere),
    ]);

    const mappedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      price: product.price,
      category: product.category,
      brand: product.brand,
    }));

    return {
      products: mappedProducts,
      meta: {
        totalItems,
        itemCount: products.length,
        itemsPerPage: limit,
        nextOffset:
          offset + products.length < totalItems ? offset + limit : null,
      },
    };
  }

  async findOne(idOrSlug: string) {
    const product = await this.productsRepository.findOne(idOrSlug);

    if (!product) {
      throw new NotFoundException(`Product not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const currentProduct = await this.findOne(id);

    let oldImageUrl: string | null = null;
    if (
      updateProductDto.imageUrl &&
      updateProductDto.imageUrl !== currentProduct.imageUrl
    ) {
      const isImageExist = await this.mediaStorage.exists(
        updateProductDto.imageUrl,
      );
      if (!isImageExist) {
        throw new BadRequestException(
          `Product image not found at path: ${updateProductDto.imageUrl}`,
        );
      }
      oldImageUrl = currentProduct.imageUrl;
    }

    const updatedProduct = await this.productsRepository.update(
      id,
      updateProductDto,
    );

    if (oldImageUrl) {
      await this.mediaStorage.delete(oldImageUrl).catch((err) => {
        console.error(`Failed to delete old product image: ${err.message}`);
      });
    }

    return updatedProduct;
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    const result = await this.productsRepository.delete(id);

    if (product.imageUrl) {
      await this.mediaStorage.delete(product.imageUrl).catch((err) => {
        console.error(`Failed to delete product image: ${err.message}`);
      });
    }

    return result;
  }
}
