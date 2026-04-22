import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaProvider } from './../src/common/providers/prisma.provider';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import { Role } from '@prisma/client';
import { MediaStorageProvider } from './../src/common/providers/media-storage.provider';

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

  const updateBrandDto = {
    name: 'Updated Brand',
    slug: 'updated-brand',
    logoUrl: 'brand/updated-logo.png',
  };

  let createdBrandId: string;
  const initialBrand = {
    name: 'Initial Brand',
    slug: 'initial-brand',
    logoUrl: 'brand/initial-logo.png',
  };

  beforeAll(async () => {
    const mockMediaStorageProvider = {
      generateSignedUploadUrl: jest.fn().mockResolvedValue({
        signUrl: 'https://mock-storage.com/upload-url',
        path: 'brands/logos/mock-id-test.png',
        token: 'mock-upload-token',
      }),
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

    // Clean any lingering from past failures
    await prisma.brand.deleteMany({
      where: {
        OR: [{ name: newBrand.name }, { slug: newBrand.slug }, { name: initialBrand.name }, { name: updateBrandDto.name }],
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

    // Seed a brand for retrieval and update tests
    const brand = await prisma.brand.create({
      data: initialBrand,
    });
    createdBrandId = brand.id;
  });

  afterAll(async () => {
    await prisma.brand.deleteMany({
      where: {
        OR: [{ name: newBrand.name }, { slug: newBrand.slug }, { name: initialBrand.name }, { name: updateBrandDto.name }],
      },
    });
    await prisma.user.deleteMany({
      where: { email: testAdmin.email },
    });
    await app.close();
  });

  describe('/brands/upload-url (POST) - Get Upload URL', () => {
    const uploadRequest = {
      fileName: 'test-logo.png',
      fileType: 'image/png',
    };

    it('should successfully generate a signed upload URL as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands/upload-url')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(uploadRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.signUrl).toBeDefined();
      expect(response.body.data.path).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail validation if fileName is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands/upload-url')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ fileType: 'image/png' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });

    it('should fail if lacking authorization', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands/upload-url')
        .send(uploadRequest)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
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

  describe('/brands/:id (GET) - Single Brand', () => {
    it('should successfully retrieve a brand by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/brands/${createdBrandId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.brand.id).toBe(createdBrandId);
      expect(response.body.data.brand.name).toBe(initialBrand.name);
    });

    it('should fail if brand does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/brands (GET) - List Brands', () => {
    beforeAll(async () => {
      // Seed extra brands for listing tests
      await prisma.brand.createMany({
        data: [
          { name: 'Samsung', slug: 'samsung', logoUrl: 'brand/samsung.png' },
          { name: 'Sony', slug: 'sony', logoUrl: 'brand/sony.png' },
          { name: 'Nike', slug: 'nike', logoUrl: 'brand/nike.png' },
        ],
      });
    });

    afterAll(async () => {
      await prisma.brand.deleteMany({
        where: {
          slug: { in: ['samsung', 'sony', 'nike'] },
        },
      });
    });

    it('should list brands with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.brands)).toBe(true);
      expect(response.body.data.brands.length).toBeGreaterThanOrEqual(4); // 3 seeded + 1 initial
      expect(response.body.meta).toBeDefined();
    });

    it('should filter brands by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands?search=Samsung')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.brands[0].name).toBe('Samsung');
    });

    it('should sort brands by name desc', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands?sortBy=name&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      const names = response.body.data.brands.map((b: any) => b.name);
      expect(names[0].localeCompare(names[1])).toBeGreaterThanOrEqual(0);
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands?limit=2&page=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.brands.length).toBe(2);
      expect(response.body.meta.currentPage).toBe(1);
    });
  });

  describe('/brands/:id (PUT/PATCH) - Update Brand', () => {
    it('should successfully update a brand as admin (PUT)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBrandDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.brand.id).toBe(createdBrandId);
      expect(response.body.data.brand.name).toBe(updateBrandDto.name);
      expect(response.body.data.brand.slug).toBe(updateBrandDto.slug);
    });

    it('should successfully partially update a brand (PATCH)', async () => {
      const patchData = { name: 'Partially Updated Brand' };
      const response = await request(app.getHttpServer())
        .patch(`/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.brand.name).toBe(patchData.name);
      expect(response.body.data.brand.slug).toBe(updateBrandDto.slug); // Stayed from previous PUT
    });

    it('should fail if brand does not exist', async () => {
      const response = await request(app.getHttpServer())
        .put('/brands/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBrandDto)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail if lacking authorization', async () => {
      const response = await request(app.getHttpServer())
        .put(`/brands/${createdBrandId}`)
        .send(updateBrandDto)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/brands/:id (DELETE) - Delete Brand', () => {
    it('should successfully delete a brand as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in DB
      const brand = await prisma.brand.findUnique({
        where: { id: createdBrandId },
      });
      expect(brand).toBeNull();
    });

    it('should fail if brand does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/brands/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail if lacking authorization', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/brands/${createdBrandId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
