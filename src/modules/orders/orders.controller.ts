import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { ControllerResponse } from '../../common/types/controller-response';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { CreateOrderDto } from './dto/request/create-order.dto';
import { ListOrdersQueryDto } from './dto/request/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/request/update-order-status.dto';
import { UploadPaymentProofDto } from './dto/request/upload-payment-proof.dto';
import { UploadUrlRequestDto } from './dto/request/upload-url-request.dto';
import { CashFlowSummaryResponseDto } from './dto/response/cash-flow-summary.dto';
import { CashFlowTransactionsResponseDto } from './dto/response/cash-flow-transaction.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── POST /orders/upload-url ──────────────────────────────────────────────────
  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a presigned URL for uploading a payment proof image',
  })
  @ApiOkResponse({ description: 'Signed URL generated successfully' })
  async getUploadUrl(
    @Body() dto: UploadUrlRequestDto,
  ): Promise<ControllerResponse> {
    const data = await this.ordersService.generateUploadUrl(dto);
    return {
      message: 'Signed URL generated successfully',
      data,
    };
  }

  // ─── POST /orders ─────────────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order (requires authentication)' })
  @ApiCreatedResponse({ description: 'Order created successfully' })
  async create(@Req() req: any, @Body() dto: CreateOrderDto): Promise<ControllerResponse> {
    const order = await this.ordersService.create(dto, req.user.id);
    return {
      message: 'Order created successfully',
      data: { order },
    };
  }

  // ─── GET /orders (Admin) ──────────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all orders with filters and pagination (Admin only)',
  })
  @ApiOkResponse({ description: 'Orders retrieved successfully' })
  async findAll(
    @Query() query: ListOrdersQueryDto,
  ): Promise<ControllerResponse> {
    const result = await this.ordersService.findAll(query);
    return {
      message: 'Orders retrieved successfully',
      data: { orders: result.orders },
      meta: result.meta,
    };
  }

  // ─── GET /orders/client ───────────────────────────────────────────────────────
  @Get('client')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all orders for the current user',
  })
  @ApiOkResponse({ description: 'Orders retrieved successfully' })
  async findAllClient(
    @Req() req: any,
    @Query() query: ListOrdersQueryDto,
  ): Promise<ControllerResponse> {
    const result = await this.ordersService.findAllClient(req.user.id, query);
    return {
      message: 'Orders retrieved successfully',
      data: { orders: result.orders },
      meta: result.meta,
    };
  }

  // ─── GET /orders/cash-flow/summary (Admin) ──────────────────────────────────
  @Get('cash-flow/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get admin cash flow summary analytics',
  })
  @ApiOkResponse({
    description: 'Cash flow summary retrieved successfully',
    type: CashFlowSummaryResponseDto,
  })
  async getCashFlowSummary(): Promise<ControllerResponse> {
    const data = await this.ordersService.getCashFlowSummary();
    return {
      message: 'Cash flow summary retrieved successfully',
      data,
    };
  }

  // ─── GET /orders/cash-flow/transactions (Admin) ──────────────────────────────
  @Get('cash-flow/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get 10 most recent non-cancelled order transactions for preview',
  })
  @ApiOkResponse({
    description: 'Recent cash flow transactions retrieved successfully',
    type: CashFlowTransactionsResponseDto,
  })
  async getCashFlowTransactions(): Promise<ControllerResponse> {
    const data = await this.ordersService.getCashFlowTransactions();
    return {
      message: 'Recent cash flow transactions retrieved successfully',
      data,
    };
  }

  // ─── GET /orders/:id ──────────────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order detail by ID' })
  @ApiOkResponse({ description: 'Order retrieved successfully' })
  async findOne(@Req() req: any, @Param('id') id: string): Promise<ControllerResponse> {
    const order = await this.ordersService.findOne(id, req.user);
    return {
      message: 'Order retrieved successfully',
      data: { order },
    };
  }

  // ─── PUT /orders/:id/status (Admin) ──────────────────────────────────────────
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiOkResponse({ description: 'Order status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<ControllerResponse> {
    const order = await this.ordersService.updateStatus(id, dto);
    return {
      message: 'Order status updated successfully',
      data: { order },
    };
  }

  // ─── POST /orders/:id/payment-proof ──────────────────────────────────────────
  @Post(':id/payment-proof')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Set payment proof path for an order (client uploads file directly to storage first)',
  })
  @ApiOkResponse({ description: 'Payment proof updated successfully' })
  async uploadPaymentProof(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UploadPaymentProofDto,
  ): Promise<ControllerResponse> {
    const order = await this.ordersService.uploadPaymentProof(id, dto, req.user);
    return {
      message: 'Payment proof updated successfully',
      data: { order },
    };
  }
}
