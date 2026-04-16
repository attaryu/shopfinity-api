import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/common/providers/prisma.provider';
import { CreateProductDto } from './dto/request/create-product.dto';
import { UpdateProductDto } from './dto/request/update-product.dto';

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaProvider) {}

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findPaginated(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.product.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        category: {
          select: { name: true, slug: true },
        },
        brand: {
          select: { name: true, slug: true, logoUrl: true },
        },
      },
    });
  }

  async countAll(where?: any) {
    return this.prisma.product.count({ where });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
