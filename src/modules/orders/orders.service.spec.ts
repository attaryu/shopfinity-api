import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { MediaStorageProvider } from '../../common/providers/media-storage.provider';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: OrdersRepository;

  const mockOrdersRepository = {
    getCashFlowSummary: jest.fn(),
    getCashFlowTransactions: jest.fn(),
  };

  const mockMediaStorageProvider = {
    generateSignedUploadUrl: jest.fn(),
    exists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: mockOrdersRepository,
        },
        {
          provide: MediaStorageProvider,
          useValue: mockMediaStorageProvider,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get<OrdersRepository>(OrdersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCashFlowSummary', () => {
    it('should return cash flow summary from repository', async () => {
      const mockSummary = {
        totalRevenue: 500000,
        totalOrders: 10,
        avgOrderValue: 50000,
        pendingPaymentTotal: 100000,
      };
      mockOrdersRepository.getCashFlowSummary.mockResolvedValue(mockSummary);

      const result = await service.getCashFlowSummary();

      expect(repository.getCashFlowSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getCashFlowTransactions', () => {
    it('should return recent transactions from repository', async () => {
      const mockTransactions = [
        {
          id: '1',
          orderNumber: 'ORD-1',
          customerName: 'Customer A',
          subtotal: 90000,
          shippingCost: 10000,
          total: 100000,
          status: OrderStatus.PROCESSING,
          createdAt: new Date(),
        },
      ];
      mockOrdersRepository.getCashFlowTransactions.mockResolvedValue(mockTransactions);

      const result = await service.getCashFlowTransactions();

      expect(repository.getCashFlowTransactions).toHaveBeenCalled();
      expect(result).toEqual(mockTransactions);
    });
  });
});
