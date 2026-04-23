import { Injectable } from '@nestjs/common';

import { PrismaProvider } from '../../common/providers/prisma.provider';

@Injectable()
export class DashboardRepository {
  constructor(private prisma: PrismaProvider) {}

  async getCounts() {
    const [product, category, brand] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.category.count(),
      this.prisma.brand.count(),
    ]);

    return { product, category, brand };
  }

  async getStockStats() {
    const stats = await this.prisma.product.aggregate({
      _sum: {
        stock: true,
      },
      _avg: {
        stock: true,
      },
    });

    return {
      allStock: stats._sum.stock || 0,
      productStockAverage: stats._avg.stock || 0,
    };
  }

  async getLowStockProducts(limit = 5) {
    return this.prisma.product.findMany({
      where: {
        stock: {
          lt: 5,
        },
      },
      take: limit,
      orderBy: {
        stock: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        imageUrl: true,
      },
    });
  }
}
