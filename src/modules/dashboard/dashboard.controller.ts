import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { ControllerResponse } from '../../common/types/controller-response';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/response/dashboard-stats-response.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiOkResponse({
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  async getStats(): Promise<ControllerResponse> {
    const data = await this.dashboardService.getStats();
    return {
      message: 'Dashboard statistics retrieved successfully',
      data,
    };
  }
}
