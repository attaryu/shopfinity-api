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

  async getCashFlowSummary() {
    const [totalOrders, avgOrderResult, pendingPaymentResult, revenueResult] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _avg: {
          total: true,
        },
        where: {
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
      }),
      this.prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          status: OrderStatus.PENDING_PAYMENT,
        },
      }),
      this.prisma.$queryRaw<Array<{ totalRevenue: bigint | null }>>`
        SELECT SUM(oi.price * oi.quantity) AS "totalRevenue"
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('PROCESSING', 'DELIVERED')
      `,
    ]);

    const totalRevenue = Number(revenueResult[0]?.totalRevenue || 0);
    const avgOrderValue = Math.round(avgOrderResult._avg.total || 0);
    const pendingPaymentTotal = pendingPaymentResult._sum.total || 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      pendingPaymentTotal,
    };
  }

  async getCashFlowTransactions() {
    return this.prisma.order.findMany({
      where: {
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        subtotal: true,
        shippingCost: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });
  }
}

