import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from './../src/common/roles.enum';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const baseUrl = '/api';
  let accessToken = '';
  let refreshToken = '';
  let academicYearId = '';
  let programId = '';
  let levelId = '';
  let groupId = '';
  let studentId = '';
  let planId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get(`${baseUrl}/health`)
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('registers and logs in an admin user', async () => {
    const email = `admin.${Date.now()}@uniconnect.local`;
    const password = 'change_this_admin_password';

    const register = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/register`)
      .send({ email, password, role: Role.SuperAdmin })
      .expect(201);

    expect(register.body.accessToken).toBeTruthy();
    expect(register.body.refreshToken).toBeTruthy();

    const login = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/login`)
      .send({ email, password })
      .expect(201);

    accessToken = login.body.accessToken;
    refreshToken = login.body.refreshToken;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  it('refreshes and logs out', async () => {
    const refresh = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/refresh`)
      .send({ refreshToken })
      .expect(201);

    expect(refresh.body.accessToken).toBeTruthy();
    expect(refresh.body.refreshToken).toBeTruthy();

    const logout = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(logout.body).toEqual({ success: true });
  });

  it('creates academic structure', async () => {
    const year = await request(app.getHttpServer())
      .post(`${baseUrl}/academic/years`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: '2025-2026',
        startDate: '2025-09-01',
        endDate: '2026-07-15',
        isActive: true,
      })
      .expect(201);

    academicYearId = year.body._id;
    expect(academicYearId).toBeTruthy();

    const program = await request(app.getHttpServer())
      .post(`${baseUrl}/academic/programs`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Informatique', code: 'INFO' })
      .expect(201);

    programId = program.body._id;
    expect(programId).toBeTruthy();

    const level = await request(app.getHttpServer())
      .post(`${baseUrl}/academic/levels`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'L1', programId })
      .expect(201);

    levelId = level.body._id;
    expect(levelId).toBeTruthy();

    const group = await request(app.getHttpServer())
      .post(`${baseUrl}/academic/groups`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'G1', levelId })
      .expect(201);

    groupId = group.body._id;
    expect(groupId).toBeTruthy();
  });

  it('lists academic entities', async () => {
    const years = await request(app.getHttpServer())
      .get(`${baseUrl}/academic/years`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(years.body.items)).toBe(true);

    const programs = await request(app.getHttpServer())
      .get(`${baseUrl}/academic/programs`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(programs.body.items)).toBe(true);
  });

  it('creates and reads a student', async () => {
    const studentNumber = `S-${Date.now()}`;
    const student = await request(app.getHttpServer())
      .post(`${baseUrl}/students`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        studentNumber,
        email: 'john.doe@uniconnect.local',
        phone: '+221700000000',
        address: 'Dakar',
        groupId,
        academicYearId,
      })
      .expect(201);

    studentId = student.body._id;
    expect(studentId).toBeTruthy();

    const fetched = await request(app.getHttpServer())
      .get(`${baseUrl}/students/${studentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(fetched.body.studentNumber).toBe(studentNumber);
  });

  it('creates payment plan and payment', async () => {
    const plan = await request(app.getHttpServer())
      .post(`${baseUrl}/payments/plans`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        studentId,
        label: 'Mensuel 2025-2026',
        totalAmount: 120000,
        currency: 'XOF',
      })
      .expect(201);

    planId = plan.body._id;
    expect(planId).toBeTruthy();

    const payment = await request(app.getHttpServer())
      .post(`${baseUrl}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        studentId,
        planId,
        amount: 10000,
        currency: 'XOF',
        paidAt: new Date().toISOString(),
        reference: `PAY-${Date.now()}`,
      })
      .expect(201);

    expect(payment.body._id).toBeTruthy();

    const listPlans = await request(app.getHttpServer())
      .get(`${baseUrl}/payments/plans`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(listPlans.body)).toBe(true);

    const listPayments = await request(app.getHttpServer())
      .get(`${baseUrl}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(listPayments.body)).toBe(true);
  });
});
