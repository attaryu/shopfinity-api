import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/common/providers/prisma.provider';
import { CreateBrandDto } from './dto/request/create-brand.dto';

@Injectable()
export class BrandsRepository {
  constructor(private prisma: PrismaProvider) {}

  async create(createBrandDto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: createBrandDto,
    });
  }

  async findPaginated(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.brand.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async countAll(where?: any) {
    return this.prisma.brand.count({ where });
  }

  async findById(id: number) {
    return this.prisma.brand.findUnique({
      where: { id },
    });
  }
}
