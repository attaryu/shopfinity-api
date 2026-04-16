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

  // Future methods like findAll, findById, etc. can be added here
}
