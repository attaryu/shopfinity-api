import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

import { PrismaProvider } from '../../common/providers/prisma.provider';

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaProvider) {}

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: { items: true },
    });
  }

  async findMany(params: {
    skip: number;
    take: number;
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.order.findMany({
      skip,
      take,
      where,
      orderBy,
      include: { items: true },
    });
  }

  async countMany(where?: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }

  async updatePaymentProof(id: string, paymentProofUrl: string) {
    return this.prisma.order.update({
      where: { id },
      data: { paymentProofUrl },
      include: { items: true },
    });
  }

  async clearUserCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });
    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  }
}
