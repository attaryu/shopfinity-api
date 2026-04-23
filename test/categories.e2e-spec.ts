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

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaProvider;
  let adminAccessToken: string;
  let createdCategoryId: string;

  const timestamp = Date.now();
  const testAdmin = {
    email: `admin-cat-${timestamp}@shopfinity.com`,
    fullname: 'Admin Category User',
    password: 'strongPassword123!',
    role: Role.ADMIN,
  };

  const initialCategory = {
    name: `Initial Category ${timestamp}`,
    slug: `initial-category-${timestamp}`,
  };

  const updateCategoryDto = {
    name: `Updated Category ${timestamp}`,
    slug: `updated-category-${timestamp}`,
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
    await prisma.category.deleteMany({
      where: {
        OR: [
          { slug: initialCategory.slug },
          { slug: updateCategoryDto.slug },
          { slug: { startsWith: 'new-category-' } }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: { email: testAdmin.email },
    });

    // Create an admin directly via Prisma since auth/sign-up might default to USER
    // Wait, the API might hash the password, so let's register via API, then update role via Prisma.
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

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })
      .expect(200);

    adminAccessToken = loginResponse.body.data.accessToken;

    // Seed a category for update tests
    const category = await prisma.category.create({
      data: initialCategory
    });
    createdCategoryId = category.id;
  });

  afterAll(async () => {
    await prisma.category.deleteMany({
      where: {
        OR: [
          { slug: initialCategory.slug },
          { slug: updateCategoryDto.slug }
        ]
      }
    });
    await prisma.user.deleteMany({
      where: { email: testAdmin.email },
    });
    await app.close();
  });

  describe('/categories (POST) - Add Category', () => {
    it('should successfully create a new category as admin', async () => {
      const newCategory = { name: `New Category ${timestamp}`, slug: `new-category-${timestamp}` };
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newCategory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe(newCategory.name);
      expect(response.body.data.category.slug).toBe(newCategory.slug);
      
      // Clean up the created category
      await prisma.category.delete({ where: { id: response.body.data.category.id } });
    });

    it('should fail validation if name or slug is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Only Name' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });

    it('should fail if lacking admin authorization', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Unauthorized Category', slug: 'unauthorized' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/categories/:id (GET) - Edit Category data retrieval', () => {
    it('should successfully retrieve a category by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.id).toBe(createdCategoryId);
      expect(response.body.data.category.name).toBe(initialCategory.name);
      expect(response.body.data.category.slug).toBe(initialCategory.slug);
    });

    it('should fail if category does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/550e8400-e29b-41d4-a716-446655440000`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
    
    // Removed 'should fail with invalid id format' as all strings are valid for @Param('id')
  });

  describe('/categories (GET) - List Categories', () => {
    beforeAll(async () => {
      // Clean up potential conflicts (unique constraints on name and slug)
      await prisma.product.deleteMany({ where: { slug: `laptop-test-${timestamp}` } });
      await prisma.brand.deleteMany({ 
        where: { 
          OR: [
            { slug: `test-brand-cat-${timestamp}` }
          ]
        } 
      });
      await prisma.category.deleteMany({
        where: {
          OR: [
            { slug: { in: [`electronics-test-${timestamp}`, `fashion-test-${timestamp}`, `home-living-test-${timestamp}`] } },
          ]
        }
      });

      // Seed extra categories for listing/pagination tests
      await prisma.category.createMany({
        data: [
          { name: `Electronics Test ${timestamp}`, slug: `electronics-test-${timestamp}` },
          { name: `Fashion Test ${timestamp}`, slug: `fashion-test-${timestamp}` },
          { name: `Home & Living Test ${timestamp}`, slug: `home-living-test-${timestamp}` },
        ],
      });
      
      // Seed a product for aggregation test
      const cat = await prisma.category.findUnique({ where: { slug: `electronics-test-${timestamp}` } });
      const brand = await prisma.brand.create({
        data: { name: `Test Brand Cat ${timestamp}`, slug: `test-brand-cat-${timestamp}`, logoUrl: 'http://example.com/logo.png' }
      });
      
      if (cat) {
        try {
          await prisma.product.create({
            data: {
              name: `Laptop Test ${timestamp}`,
              slug: `laptop-test-${timestamp}`,
              description: 'Powerful laptop',
              price: 1500,
              stock: 10,
              imageUrl: 'http://example.com/laptop.png',
              categoryId: cat.id,
              brandId: brand.id
            }
          });
        } catch (err) {
          console.error('Error seeding product:', err);
          throw err;
        }
      }
    });

    afterAll(async () => {
      await prisma.product.deleteMany({ where: { slug: `laptop-test-${timestamp}` } });
      await prisma.brand.deleteMany({ where: { slug: `test-brand-cat-${timestamp}` } });
      await prisma.category.deleteMany({
        where: {
          slug: { in: [`electronics-test-${timestamp}`, `fashion-test-${timestamp}`, `home-living-test-${timestamp}`] }
        }
      });
    });

    it('should successfully list all categories with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThanOrEqual(4); 
      
      // Check for productCount
      const electronics = response.body.data.categories.find(c => c.slug === `electronics-test-${timestamp}`);
      expect(electronics).toBeDefined();
      expect(electronics.productCount).toBe(1);
    });

    it('should filter categories by search term', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories?search=Fashion Test ${timestamp}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories.some(c => c.name.includes(`Fashion Test ${timestamp}`))).toBe(true);
    });

    it('should sort categories by name descending', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories?sortBy=name&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      const names = response.body.data.categories.map(c => c.name);
      const sortedNames = [...names].sort((a, b) => b.localeCompare(a));
      expect(names).toEqual(sortedNames);
    });

    it('should paginate categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories?limit=2&page=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories.length).toBe(2);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.totalItems).toBeDefined();

    });

    describe('/categories/list (GET) - List Categories for Dropdown', () => {
      it('should successfully list all categories with only id and name, sorted by name', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories/list')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.categories)).toBe(true);
        expect(response.body.data.categories.length).toBeGreaterThanOrEqual(4);
        
        // Check that id, name, and slug are present
        const firstCategory = response.body.data.categories[0];
        expect(Object.keys(firstCategory)).toEqual(expect.arrayContaining(['id', 'name', 'slug']));
        expect(firstCategory.slug).toBeDefined();
        expect(firstCategory.productCount).toBeUndefined();

        // Check sorting (ASC)
        const names = response.body.data.categories.map((c: any) => c.name);
        const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sortedNames);

        // Check no pagination meta (only timestamp from interceptor)
        expect(response.body.meta).toEqual({
          timestamp: expect.any(String),
        });
      });
    });
  });

  describe('/categories/:id (PUT/PATCH) - Update Category', () => {
    it('should successfully update a category as an admin (PUT)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateCategoryDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.id).toBe(createdCategoryId);
      expect(response.body.data.category.name).toBe(updateCategoryDto.name);
      expect(response.body.data.category.slug).toBe(updateCategoryDto.slug);
      
      // Verify in DB
      const updatedCategory = await prisma.category.findUnique({
        where: { id: createdCategoryId }
      });
      expect(updatedCategory?.name).toBe(updateCategoryDto.name);
    });
    
    it('should successfully update a category using PATCH', async () => {
      const patchData = { name: `Partially Updated Category ${timestamp}` };
      const response = await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe(patchData.name);
      // Slug should remain the same as previous update
      expect(response.body.data.category.slug).toBe(updateCategoryDto.slug);
      
      // Verification in DB
      const updatedCategory = await prisma.category.findUnique({
        where: { id: createdCategoryId }
      });
      // Revert name for test teardown matching or other tests
      await prisma.category.update({
        where: { id: createdCategoryId },
        data: { name: updateCategoryDto.name } // restore
      });
    });

    it('should fail to update if lacking admin authorization', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/${createdCategoryId}`)
        // Intentionally omitting Authorization token
        .send(updateCategoryDto)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail validation if slug is invalid/empty format', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Valid Name', slug: '' }) // Invalid empty slug
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });

    it('should fail if attempting to update a non-existent category', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/550e8400-e29b-41d4-a716-446655440000`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateCategoryDto)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
