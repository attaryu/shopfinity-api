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

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaProvider;
  let adminAccessToken: string;
  let testCategoryId: string;
  let testBrandId: string;
  let createdProductId: string;
  let storageProvider: MediaStorageProvider;

  const timestamp = Date.now();
  const testAdmin = {
    email: `admin-prod-${timestamp}@shopfinity.com`,
    fullname: 'Admin Product User',
    password: 'strongPassword123!',
    role: Role.ADMIN,
  };

  const newProduct = {
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'The latest iPhone with titanium design',
    price: 999.99,
    stock: 50,
    imageUrl: 'products/iphone-15.png',
  };

  const initialProduct = {
    name: 'Initial Product',
    slug: 'initial-product',
    description: 'Initial description',
    price: 100,
    stock: 10,
    imageUrl: 'products/initial.png',
  };

  const updateProductDto = {
    name: 'Updated Product',
    slug: 'updated-product',
    description: 'Updated description',
    price: 150.5,
    stock: 20,
    imageUrl: 'products/updated.png',
  };

  beforeAll(async () => {
    const mockMediaStorageProvider = {
      generateSignedUploadUrl: jest.fn().mockResolvedValue({
        signUrl: 'https://mock-storage.com/upload-url',
        path: 'products/images/mock-id-test.png',
        token: 'mock-upload-token',
      }),
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
    storageProvider = app.get(MediaStorageProvider);

    // Clean any lingering from past failures
    await prisma.product.deleteMany({
      where: {
        OR: [
          { slug: newProduct.slug },
          { slug: initialProduct.slug },
          { slug: updateProductDto.slug },
          { slug: 'search-product' },
        ],
      },
    });

    await prisma.category.deleteMany({
      where: { slug: 'test-category-prod' },
    });

    await prisma.brand.deleteMany({
      where: { slug: 'test-brand-prod' },
    });

    await prisma.user.deleteMany({
      where: { email: testAdmin.email },
    });

    // Create prerequisites
    const category = await prisma.category.create({
      data: { name: 'Test Category Prod', slug: 'test-category-prod' },
    });
    testCategoryId = category.id;

    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand Prod',
        slug: 'test-brand-prod',
        logoUrl: 'brand/test.png',
      },
    });
    testBrandId = brand.id;

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

    // Seed a product for retrieval and update tests
    const product = await prisma.product.create({
      data: {
        ...initialProduct,
        categoryId: testCategoryId,
        brandId: testBrandId,
      },
    });
    createdProductId = product.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({
      where: {
        OR: [
          { slug: newProduct.slug },
          { slug: initialProduct.slug },
          { slug: updateProductDto.slug },
          { slug: 'search-product' },
        ],
      },
    });
    await prisma.category.deleteMany({ where: { id: testCategoryId } });
    await prisma.brand.deleteMany({ where: { id: testBrandId } });
    await prisma.user.deleteMany({ where: { email: testAdmin.email } });
    await app.close();
  });

  describe('/products/upload-url (POST)', () => {
    it('should successfully generate a signed URL as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/upload-url')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          fileName: 'iphone.png',
          fileType: 'image/png',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.signUrl).toBeDefined();
      expect(response.body.data.path).toContain('products/images/');
    });

    it('should fail if lacking authorization', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/upload-url')
        .send({
          fileName: 'iphone.png',
          fileType: 'image/png',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/products (POST) - Add Product', () => {
    it('should successfully create a new product as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...newProduct,
          categoryId: testCategoryId,
          brandId: testBrandId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(newProduct.name);
      expect(response.body.data.product.categoryId).toBe(testCategoryId);
      expect(response.body.data.product.brandId).toBe(testBrandId);

      // Clean up the created product
      await prisma.product.delete({
        where: { id: response.body.data.product.id },
      });
    });

    it('should fail if imageUrl does not exist in storage', async () => {
      jest.spyOn(storageProvider, 'exists').mockResolvedValueOnce(false);

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...newProduct,
          name: 'Not Found Image Product',
          slug: 'not-found-image',
          categoryId: testCategoryId,
          brandId: testBrandId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product image not found');
    });

    it('should fail validation if categoryId is missing', async () => {
      const invalidProduct = { ...newProduct, brandId: testBrandId };
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });

    it('should fail if lacking authorization', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({
          ...newProduct,
          categoryId: testCategoryId,
          brandId: testBrandId,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/products/:id (GET) - Single Product', () => {
    it('should successfully retrieve a product by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${createdProductId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBe(createdProductId);
      expect(response.body.data.product.name).toBe(initialProduct.name);
    });

    it('should fail if product does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/products (GET) - List Products', () => {
    beforeAll(async () => {
      // Seed extra products for listing tests
      await prisma.product.createMany({
        data: [
          {
            name: 'Search Product',
            slug: 'search-product',
            description: 'Searchable desc',
            price: 50.0,
            stock: 5,
            imageUrl: 'search.png',
            categoryId: testCategoryId,
            brandId: testBrandId,
          },
        ],
      });
    });

    it('should list products with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2); // 1 initial + 1 extra
      expect(response.body.meta).toBeDefined();
    });

    it('should filter products by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?search=Search')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products[0].name).toBe('Search Product');
    });

    it('should filter products by categoryId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products?categoryId=${testCategoryId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.products.every(
          (p: any) => p.categoryId === testCategoryId,
        ),
      ).toBe(true);
    });

    it('should filter products by brandId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products?brandId=${testBrandId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.products.every(
          (p: any) => p.brandId === testBrandId,
        ),
      ).toBe(true);
    });

    it('should sort products by price desc', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?sortBy=price&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      const prices = response.body.data.products.map((p: any) => p.price);
      expect(prices[0]).toBeGreaterThanOrEqual(prices[1]);
    });
  });

  describe('/products/:id (PUT/PATCH) - Update Product', () => {
    it('should successfully update a product as admin (PUT)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...updateProductDto,
          categoryId: testCategoryId,
          brandId: testBrandId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBe(createdProductId);
      expect(response.body.data.product.name).toBe(updateProductDto.name);
      expect(response.body.data.product.price).toBe(updateProductDto.price);
    });

    it('should successfully partially update a product (PATCH)', async () => {
      const patchData = { name: 'Partially Updated Product' };
      const response = await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(patchData.name);
      expect(response.body.data.product.price).toBe(updateProductDto.price); // Stayed from previous PUT
    });

    it('should fail if product does not exist', async () => {
      const response = await request(app.getHttpServer())
        .put('/products/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...updateProductDto,
          categoryId: testCategoryId,
          brandId: testBrandId,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should delete existing image from storage when imageUrl is updated', async () => {
      // Create a fresh product for this test
      const productToUpdate = await prisma.product.create({
        data: {
          name: 'Life Cycle Update Test',
          slug: 'lc-prod-update-test',
          description: 'test',
          price: 10,
          stock: 1,
          imageUrl: 'products/old-image.png',
          categoryId: testCategoryId,
          brandId: testBrandId,
        },
      });

      const deleteSpy = storageProvider.delete as jest.Mock;
      deleteSpy.mockClear();

      jest.spyOn(storageProvider, 'exists').mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .patch(`/products/${productToUpdate.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ imageUrl: 'products/new-image.png' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith('products/old-image.png');

      // Cleanup
      await prisma.product.delete({ where: { id: productToUpdate.id } });
    });
  });

  describe('/products/:id (DELETE) - Delete Product', () => {
    it('should successfully delete a product as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in DB
      const product = await prisma.product.findUnique({
        where: { id: createdProductId },
      });
      expect(product).toBeNull();
    });

    it('should fail if product does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/products/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should delete image from storage when product is deleted', async () => {
      // Seed a new product specifically for deletion test
      const productToDelete = await prisma.product.create({
        data: {
          name: 'Life Cycle Delete Test',
          slug: 'lc-prod-delete-test',
          description: 'test',
          price: 10,
          stock: 1,
          imageUrl: 'products/delete-me.png',
          categoryId: testCategoryId,
          brandId: testBrandId,
        },
      });

      const deleteSpy = storageProvider.delete as jest.Mock;
      deleteSpy.mockClear();

      const response = await request(app.getHttpServer())
        .delete(`/products/${productToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith('products/delete-me.png');
    });
  });
});
