import { ApiProperty } from '@nestjs/swagger';

export class CashFlowSummaryDataDto {
  @ApiProperty({
    example: 4500000,
    description: 'Total revenue from processing or completed (delivered) orders',
  })
  totalRevenue: number;

  @ApiProperty({
    example: 42,
    description: 'Total number of orders across all statuses',
  })
  totalOrders: number;

  @ApiProperty({
    example: 215000,
    description: 'Average order value for all non-cancelled orders',
  })
  avgOrderValue: number;

  @ApiProperty({
    example: 780000,
    description: 'Total pending payment amount',
  })
  pendingPaymentTotal: number;
}

export class CashFlowSummaryResponseDto {
  @ApiProperty({ example: 'Cash flow summary retrieved successfully' })
  message: string;

  @ApiProperty({ type: CashFlowSummaryDataDto })
  data: CashFlowSummaryDataDto;
}
