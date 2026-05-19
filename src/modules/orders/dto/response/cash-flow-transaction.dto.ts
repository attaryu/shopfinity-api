import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class CashFlowTransactionDataDto {
  @ApiProperty({
    example: 'd3b07384-d113-4ec5-a5f5-056a82741a2c',
    description: 'Unique identifier of the order',
  })
  id: string;

  @ApiProperty({
    example: 'ORD-20260519-0001',
    description: 'Order transaction number',
  })
  orderNumber: string;

  @ApiProperty({
    example: 'Budi Santoso',
    description: 'Name of the customer',
  })
  customerName: string;

  @ApiProperty({
    example: 200000,
    description: 'Subtotal of the order items',
  })
  subtotal: number;

  @ApiProperty({
    example: 15000,
    description: 'Cost of shipping',
  })
  shippingCost: number;

  @ApiProperty({
    example: 215000,
    description: 'Total transaction amount including shipping and other fees',
  })
  total: number;

  @ApiProperty({
    example: 'PROCESSING',
    enum: OrderStatus,
    description: 'Current status of the order',
  })
  status: OrderStatus;

  @ApiProperty({
    example: '2026-05-19T10:00:00.000Z',
    description: 'Order creation timestamp',
  })
  createdAt: Date;
}

export class CashFlowTransactionsResponseDto {
  @ApiProperty({ example: 'Recent cash flow transactions retrieved successfully' })
  message: string;

  @ApiProperty({ type: [CashFlowTransactionDataDto] })
  data: CashFlowTransactionDataDto[];
}
