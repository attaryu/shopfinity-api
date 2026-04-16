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

describe('BrandsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaProvider;
  let adminAccessToken: string;

  const timestamp = Date.now();
  const testAdmin = {
    email: `admin-brand-${timestamp}@shopfinity.com`,
    fullname: 'Admin Brand User',
    password: 'strongPassword123!',
    role: Role.ADMIN,
  };

  const newBrand = {
    name: 'Apple',
    slug: 'apple',
    logoUrl: `brand/apple-logo-${timestamp}.png`,
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

    // Clean any lingering from past failures
    await prisma.brand.deleteMany({
      where: {
        OR: [{ name: newBrand.name }, { slug: newBrand.slug }],
      },
    });

    await prisma.user.deleteMany({
      where: { email: testAdmin.email },
    });

    // Register admin via API
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({
        email: testAdmin.email,
        fullname: testAdmin.fullname,
        password: testAdmin.password,
      })
      .expect(201);

    // Update role to ADMIN directly in DB
    await prisma.user.update({
      where: { email: testAdmin.email },
      data: { role: Role.ADMIN },
    });

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })
      .expect(200);

    adminAccessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.brand.deleteMany({
      where: {
        OR: [{ name: newBrand.name }, { slug: newBrand.slug }],
      },
    });
    await prisma.user.deleteMany({
      where: { email: testAdmin.email },
    });
    await app.close();
  });

  describe('/brands (POST) - Add Brand', () => {
    it('should successfully create a new brand as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newBrand)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.brand.name).toBe(newBrand.name);
      expect(response.body.data.brand.slug).toBe(newBrand.slug);
      expect(response.body.data.brand.logoUrl).toBe(newBrand.logoUrl);

      // Clean up the created brand
      await prisma.brand.delete({ where: { id: response.body.data.brand.id } });
    });

    it('should fail validation if logoUrl is missing', async () => {
      const { logoUrl, ...invalidBrand } = newBrand;
      const response = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(invalidBrand)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });

    it('should fail validation if name or slug is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Only Name', logoUrl: newBrand.logoUrl })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });

    it('should fail if lacking authorization', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands')
        .send(newBrand)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
