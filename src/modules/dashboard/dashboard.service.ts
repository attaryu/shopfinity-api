import { Injectable } from '@nestjs/common';

import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStats() {
    const [counts, stockStats, lowStockProducts] = await Promise.all([
      this.dashboardRepository.getCounts(),
      this.dashboardRepository.getStockStats(),
      this.dashboardRepository.getLowStockProducts(),
    ]);

    return {
      total: counts,
      allStock: stockStats.allStock,
      productStockAverate: stockStats.productStockAverage,
      lowStockProducts: lowStockProducts,
    };
  }
}
