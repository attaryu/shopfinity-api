import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MediaStorageProvider } from 'src/common/providers/media-storage.provider';
import { BrandsRepository } from './brands.repository';
import { CreateBrandDto } from './dto/request/create-brand.dto';
import { ListBrandsQueryDto } from './dto/request/list-brands-query.dto';
import { UpdateBrandDto } from './dto/request/update-brand.dto';
import { UploadUrlRequestDto } from './dto/request/upload-url-request.dto';

@Injectable()
export class BrandsService {
  constructor(
    private readonly brandsRepository: BrandsRepository,
    private readonly mediaStorage: MediaStorageProvider,
  ) {}

  async generateUploadUrl(uploadUrlRequestDto: UploadUrlRequestDto) {
    const { fileName } = uploadUrlRequestDto;
    const randomId = crypto.randomUUID();
    const path = `brands/logos/${randomId}-${fileName}`;

    return this.mediaStorage.generateSignedUploadUrl(path);
  }

  async create(createBrandDto: CreateBrandDto) {
    const isLogoExist = await this.mediaStorage.exists(createBrandDto.logoUrl);
    if (!isLogoExist) {
      throw new BadRequestException(
        `Logo file not found at path: ${createBrandDto.logoUrl}`,
      );
    }
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

  async findById(id: string) {
    const brand = await this.brandsRepository.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const currentBrand = await this.findById(id);

    let oldLogoUrl: string | null = null;
    if (
      updateBrandDto.logoUrl &&
      updateBrandDto.logoUrl !== currentBrand.logoUrl
    ) {
      const isLogoExist = await this.mediaStorage.exists(
        updateBrandDto.logoUrl,
      );
      if (!isLogoExist) {
        throw new BadRequestException(
          `Logo file not found at path: ${updateBrandDto.logoUrl}`,
        );
      }
      oldLogoUrl = currentBrand.logoUrl;
    }

    const updatedBrand = await this.brandsRepository.update(id, updateBrandDto);

    if (oldLogoUrl) {
      await this.mediaStorage.delete(oldLogoUrl).catch((err) => {
        // Log error but don't fail the request if deletion fails
        console.error(`Failed to delete old logo: ${err.message}`);
      });
    }

    return updatedBrand;
  }

  async remove(id: string) {
    const brand = await this.findById(id);
    const result = await this.brandsRepository.delete(id);

    if (brand.logoUrl) {
      await this.mediaStorage.delete(brand.logoUrl).catch((err) => {
        console.error(`Failed to delete brand logo: ${err.message}`);
      });
    }

    return result;
  }
}
