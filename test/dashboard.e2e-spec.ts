import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaProvider } from './../src/common/providers/prisma.provider';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import { Role } from '@prisma/client';

jest.setTimeout(30000);

describe('DashboardController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaProvider;
  let adminAccessToken: string;
  let userAccessToken: string;

  const timestamp = Date.now();
  const testAdmin = {
    email: `admin-dash-${timestamp}@shopfinity.com`,
    fullname: 'Admin Dashboard User',
    password: 'strongPassword123!',
    role: Role.ADMIN,
  };

  const testUser = {
    email: `user-dash-${timestamp}@shopfinity.com`,
    fullname: 'Regular Dashboard User',
    password: 'strongPassword123!',
    role: Role.USER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    
    // Clean up users
    await prisma.user.deleteMany({
      where: { email: { in: [testAdmin.email, testUser.email] } },
    });

    // Create admin
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({
        email: testAdmin.email,
        fullname: testAdmin.fullname,
        password: testAdmin.password,
      })
      .expect(201);
      
    await prisma.user.update({
      where: { email: testAdmin.email },
      data: { role: Role.ADMIN },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })
      .expect(200);

    adminAccessToken = adminLogin.body.data.accessToken;

    // Create regular user
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({
        email: testUser.email,
        fullname: testUser.fullname,
        password: testUser.password,
      })
      .expect(201);

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    userAccessToken = userLogin.body.data.accessToken;

    // Seed data for dashboard
    const category = await prisma.category.create({
      data: { name: `Dash Cat ${timestamp}`, slug: `dash-cat-${timestamp}` },
    });

    const brand = await prisma.brand.create({
      data: { name: `Dash Brand ${timestamp}`, slug: `dash-brand-${timestamp}`, logoUrl: 'logo.png' },
    });

    await prisma.product.createMany({
      data: [
        {
          name: 'High Stock Product',
          slug: `high-stock-${timestamp}`,
          description: 'Desc',
          price: 100,
          stock: 50,
          imageUrl: 'img1.png',
          categoryId: category.id,
          brandId: brand.id,
        },
        {
          name: 'Low Stock Product 1',
          slug: `low-stock-1-${timestamp}`,
          description: 'Desc',
          price: 200,
          stock: 3, // < 5
          imageUrl: 'img2.png',
          categoryId: category.id,
          brandId: brand.id,
        },
        {
          name: 'Low Stock Product 2',
          slug: `low-stock-2-${timestamp}`,
          description: 'Desc',
          price: 300,
          stock: 4, // < 5
          imageUrl: 'img3.png',
          categoryId: category.id,
          brandId: brand.id,
        },
        {
          name: 'Boundary Stock Product',
          slug: `boundary-stock-${timestamp}`,
          description: 'Desc',
          price: 400,
          stock: 5, // Not low stock (must be < 5)
          imageUrl: 'img4.png',
          categoryId: category.id,
          brandId: brand.id,
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up seeded data
    const products = await prisma.product.findMany({
      where: { slug: { contains: `${timestamp}` } },
    });
    const productIds = products.map(p => p.id);
    
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await prisma.category.deleteMany({ where: { slug: `dash-cat-${timestamp}` } });
    await prisma.brand.deleteMany({ where: { slug: `dash-brand-${timestamp}` } });
    await prisma.user.deleteMany({
      where: { email: { in: [testAdmin.email, testUser.email] } },
    });
    await app.close();
  });

  describe('GET /dashboard', () => {
    it('should successfully retrieve dashboard stats as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.total.product).toBeGreaterThanOrEqual(4);
      expect(response.body.data.total.category).toBeGreaterThanOrEqual(1);
      expect(response.body.data.total.brand).toBeGreaterThanOrEqual(1);

      expect(response.body.data.allStock).toBeGreaterThanOrEqual(62); // 50 + 3 + 4 + 5 = 62
      expect(response.body.data.productStockAverate).toBeDefined();

      expect(Array.isArray(response.body.data.lowStockProducts)).toBe(true);
      // Should contain products with stock 3 and 4
      const lowStockNames = response.body.data.lowStockProducts.map((p: any) => p.name);
      expect(lowStockNames).toContain('Low Stock Product 1');
      expect(lowStockNames).toContain('Low Stock Product 2');
      expect(lowStockNames).not.toContain('Boundary Stock Product');
      expect(lowStockNames).not.toContain('High Stock Product');
    });

    it('should fail to retrieve stats as regular user (403)', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail to retrieve stats as guest (401)', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
