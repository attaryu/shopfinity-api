import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';

import { MediaStorageProvider } from '../../common/providers/media-storage.provider';
import { CreateOrderDto } from './dto/request/create-order.dto';
import { ListOrdersQueryDto } from './dto/request/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/request/update-order-status.dto';
import { UploadPaymentProofDto } from './dto/request/upload-payment-proof.dto';
import { UploadUrlRequestDto } from './dto/request/upload-url-request.dto';
import { OrdersRepository } from './orders.repository';

// Valid status transitions as per spec
const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly mediaStorage: MediaStorageProvider,
  ) {}

  // ─── Generate Order Number ────────────────────────────────────────────────────
  private generateOrderNumber(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit
    return `INV/${yy}${mm}${dd}/${rand}`;
  }

  // ─── Create Order ─────────────────────────────────────────────────────────────
  async create(dto: CreateOrderDto, userId: string) {
    const { items, shippingMethod, paymentMethod, address, ...rest } = dto;

    const shippingCost = shippingMethod.cost;
    const total = rest.subtotal + shippingCost;
    const orderNumber = this.generateOrderNumber();

    const order = await this.ordersRepository.create({
      orderNumber,
      user: { connect: { id: userId } },
      customerName: rest.customerName,
      customerEmail: rest.customerEmail ?? '',
      address: address as any,
      subtotal: rest.subtotal,
      shippingCost,
      total,
      shippingMethod: shippingMethod as any,
      paymentMethod: paymentMethod as any,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl ?? null,
        })),
      },
    });

    // Clear user's cart after successful order creation
    await this.ordersRepository.clearUserCart(userId);

    return order;
  }

  // ─── List Orders (Admin) ──────────────────────────────────────────────────────
  async findAll(query: ListOrdersQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, totalItems] = await Promise.all([
      this.ordersRepository.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.ordersRepository.countMany(where),
    ]);

    return {
      orders,
      meta: {
        totalItems,
        itemCount: orders.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  // ─── List Orders (Client) ──────────────────────────────────────────────────────
  async findAllClient(userId: string, query: ListOrdersQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, totalItems] = await Promise.all([
      this.ordersRepository.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.ordersRepository.countMany(where),
    ]);

    return {
      orders,
      meta: {
        totalItems,
        itemCount: orders.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  // ─── Get Order Detail ─────────────────────────────────────────────────────────
  async findOne(id: string, user?: { id: string; role: Role }) {
    const order = await this.ordersRepository.findOne(id);

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    if (user && user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new NotFoundException(`Order not found`);
    }

    return order;
  }

  // ─── Update Order Status ──────────────────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);
    const allowedNext = STATUS_TRANSITIONS[order.status];

    if (!allowedNext || !allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${dto.status}`,
      );
    }

    return this.ordersRepository.updateStatus(id, dto.status);
  }

  // ─── Generate Payment Proof Upload URL ───────────────────────────────────────
  async generateUploadUrl(dto: UploadUrlRequestDto) {
    const randomId = crypto.randomUUID();
    const path = `orders/payment-proofs/${randomId}-${dto.fileName}`;
    return this.mediaStorage.generateSignedUploadUrl(path);
  }

  // ─── Set Payment Proof Path ───────────────────────────────────────────────────
  async uploadPaymentProof(id: string, dto: UploadPaymentProofDto, user: { id: string; role: Role }) {
    // Ensure order exists and belongs to user (or user is admin)
    await this.findOne(id, user);

    // Verify the file was actually uploaded to storage
    const fileExists = await this.mediaStorage.exists(dto.path);
    if (!fileExists) {
      throw new BadRequestException(
        `Payment proof file not found at path: ${dto.path}`,
      );
    }

    return this.ordersRepository.updatePaymentProof(id, dto.path);
  }

  // ─── Cash Flow API (Admin) ───────────────────────────────────────────────────
  async getCashFlowSummary() {
    return this.ordersRepository.getCashFlowSummary();
  }

  async getCashFlowTransactions() {
    return this.ordersRepository.getCashFlowTransactions();
  }
}
