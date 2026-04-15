import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaProvider } from './../src/common/providers/prisma.provider';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';

jest.setTimeout(30000);

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaProvider;
  let jwtAccessToken: string;

  const timestamp = Date.now();
  const testUser = {
    email: `test-users-${timestamp}@shopfinity.com`,
    fullname: 'E2E Users User',
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
    
    // Clean any lingering from past failures
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    // Create user and get access token for testing protected user endpoints
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    jwtAccessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should get current user profile successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${jwtAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.fullname).toBe(testUser.fullname);
      // Ensure sensitive data is not returned
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail if no authorization header is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBe('Unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
