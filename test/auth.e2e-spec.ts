import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaProvider } from './../src/common/providers/prisma.provider';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';

jest.setTimeout(30000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaProvider;
  let jwtAccessToken: string;
  let jwtRefreshTokenCookie: string;

  const timestamp = Date.now();
  const testUser = {
    email: `test-auth-${timestamp}@shopfinity.com`,
    fullname: 'E2E Auth User',
    password: 'strongPassword123!',
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

    // Safety check: remove if exists lingering from past failures
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  describe('/auth/sign-up (POST)', () => {
    it('should create a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.fullname).toBe(testUser.fullname);
      // Password must not be returned
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail if email is already taken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(testUser)
        .expect(409); // Conflict Exception is typically 409

      expect(response.body.success).toBe(false);
    });

    it('should fail validation if password is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          ...testUser,
          email: `another-${timestamp}@shopfinity.com`,
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toContain(
        'password must be longer than or equal to 6 characters',
      );
    });

    it('should fail validation if email is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          fullname: 'No Email User',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toContain('email must be an email');
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully and set refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      jwtAccessToken = response.body.data.accessToken;

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const refreshTokenCookie = cookies.find((c) =>
        c.startsWith('refreshToken='),
      );
      expect(refreshTokenCookie).toBeDefined();

      if (refreshTokenCookie) {
        // Save for the next tests
        jwtRefreshTokenCookie = refreshTokenCookie.split(';')[0];
      }
    });

    it('should fail with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongPassword!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'doesnotexist@shopfinity.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh token successfully with valid cookie', async () => {
      // Add a small delay to ensure the timestamp (iat) in the JWT changes
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', jwtRefreshTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      // Ensure it's a newly generated access token
      expect(response.body.data.accessToken).not.toBe(jwtAccessToken);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
    });

    it('should fail if refresh token cookie is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/auth/logout (DELETE)', () => {
    it('should protect logout endpoint, failing without token', async () => {
      await request(app.getHttpServer()).delete('/auth/logout').expect(401);
    });

    it('should logout successfully with valid token and clear cookie', async () => {
      const response = await request(app.getHttpServer())
        .delete('/auth/logout')
        .set('Authorization', `Bearer ${jwtAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');

      // Check if cookie is cleared (expires in past or max-age=0 depending on clearCookie implementation)
      const cookies = response.headers['set-cookie'] as unknown as string[];
      const refreshTokenCookie = cookies.find((c) =>
        c.startsWith('refreshToken='),
      );
      expect(refreshTokenCookie).toContain('Expires=');
    });
  });
});
