import { Injectable } from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import { CreateBrandDto } from './dto/request/create-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepository: BrandsRepository) {}

  async create(createBrandDto: CreateBrandDto) {
    return this.brandsRepository.create(createBrandDto);
  }
}
