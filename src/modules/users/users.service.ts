import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.usersRepository.create(createUserDto);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async storeRefreshToken(userId: string, hashedRefreshToken: string) {
    await this.usersRepository.updateRefreshToken(userId, hashedRefreshToken);
  }

  async clearRefreshToken(userId: string) {
    await this.usersRepository.updateRefreshToken(userId, null);
  }

  async findById(userId: string) {
    return this.usersRepository.findById(userId);
  }

  async findByIdWithRefreshToken(userId: string) {
    return this.usersRepository.findByIdWithRefreshToken(userId);
  }
}
