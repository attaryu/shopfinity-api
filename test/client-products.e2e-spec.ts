import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaProvider } from './../src/common/providers/prisma.provider';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import { MediaStorageProvider } from './../src/common/providers/media-storage.provider';

describe('ProductsController Client Listing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaProvider;
  let testCategoryId: string;
  let testBrandId: string;
  let testCategorySlug = 'client-test-category';
  let testBrandSlug = 'client-test-brand';

  beforeAll(async () => {
    const mockMediaStorageProvider = {
      exists: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MediaStorageProvider)
      .useValue(mockMediaStorageProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaProvider);

    // Setup test data - Clean everything first for isolation
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.brand.deleteMany({});

    const category = await prisma.category.create({
      data: { name: 'Client Test Category', slug: testCategorySlug },
    });
    testCategoryId = category.id;

    const brand = await prisma.brand.create({
      data: {
        name: 'Client Test Brand',
        slug: testBrandSlug,
        logoUrl: 'brand/client-test.png',
      },
    });
    testBrandId = brand.id;

    // Create 15 products to test pagination (limit 12)
    const productsData = Array.from({ length: 15 }).map((_, i) => ({
      name: `Product ${i + 1}`,
      slug: `product-${i + 1}`,
      description: `Description ${i + 1}`,
      price: (i + 1) * 10,
      stock: 10,
      imageUrl: `products/product-${i + 1}.png`,
      categoryId: testCategoryId,
      brandId: testBrandId,
      createdAt: new Date(Date.now() + i * 1000), // Ensure different creation times
    }));

    // We can't use createMany with relations easily or ensure order, so we'll do them one by one or trust createdAt
    for (const data of productsData) {
      await prisma.product.create({ data });
    }
  });

  afterAll(async () => {
    await prisma.product.deleteMany({
      where: {
        slug: { startsWith: 'product-' },
      },
    });
    await prisma.category.delete({ where: { id: testCategoryId } });
    await prisma.brand.delete({ where: { id: testBrandId } });
    await app.close();
  });

  describe('/products/client (GET)', () => {
    it('should return 12 products by default, sorted by newest', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/client')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(12);

      // Verify fields
      const product = response.body.data.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('image');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('brand');

      // Verify sorting (newest first)
      const firstPrice = response.body.data.products[0].price;
      const secondPrice = response.body.data.products[1].price;
      // In our setup, higher index i means newer createdAt and higher price
      expect(firstPrice).toBeGreaterThan(secondPrice);
    });

    it('should handle pagination with nextOffset', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/client?nextOffset=12')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(3); // 15 total - 12 skipped
    });

    it('should filter by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/client?search=Product 10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Product 10');
    });

    it('should filter by brand slug', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/client?brand=${testBrandSlug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
      expect(response.body.data.products[0].brand.slug).toBe(testBrandSlug);
    });

    it('should filter by category slug', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/client?category=${testCategorySlug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
      expect(response.body.data.products[0].category.slug).toBe(
        testCategorySlug,
      );
    });

    it('should filter by minPrice and maxPrice', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/client?minPrice=50&maxPrice=100')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Prices are (i+1)*10. So 50, 60, 70, 80, 90, 100
      expect(response.body.data.products).toHaveLength(6);
      response.body.data.products.forEach((p: any) => {
        expect(p.price).toBeGreaterThanOrEqual(50);
        expect(p.price).toBeLessThanOrEqual(100);
      });
    });
  });
});
