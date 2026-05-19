import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { AddCartItemDto } from './dto/request/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/request/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  async getCart(userId: string) {
    return this.cartRepository.findOrCreateCart(userId);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.cartRepository.findOrCreateCart(userId);
    await this.cartRepository.addOrUpdateItem(cart.id, dto.productId, dto.quantity);
    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.cartRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not own this cart item');
    }

    await this.cartRepository.updateItemQuantity(itemId, dto.quantity);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.cartRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not own this cart item');
    }

    await this.cartRepository.deleteItem(itemId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepository.findOrCreateCart(userId);
    await this.cartRepository.clearCart(cart.id);
    return this.getCart(userId);
  }
}
