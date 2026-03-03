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
  let teacherId = '';
  let roomId = '';
  let studentId = '';
  let planId = '';
  let subjectId = '';
  let evaluationId = '';
  let conversationId = '';

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
    const password = 'Admin1234!';

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
    const suffix = Date.now();
    const year = await request(app.getHttpServer())
      .post(`${baseUrl}/academic/years`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `2025-2026-${suffix}`,
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
      .send({ name: `Informatique-${suffix}`, code: `INFO-${suffix}` })
      .expect(201);

    programId = program.body._id;
    expect(programId).toBeTruthy();

    const level = await request(app.getHttpServer())
      .post(`${baseUrl}/academic/levels`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `L1-${suffix}`, programId })
      .expect(201);

    levelId = level.body._id;
    expect(levelId).toBeTruthy();

    const group = await request(app.getHttpServer())
      .post(`${baseUrl}/academic/groups`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `G1-${suffix}`, levelId })
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

  it('creates a teacher user', async () => {
    const email = `teacher.${Date.now()}@uniconnect.local`;
    const teacher = await request(app.getHttpServer())
      .post(`${baseUrl}/users`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email,
        password: 'Teacher1234!',
        role: Role.Teacher,
      })
      .expect(201);

    teacherId = teacher.body.id;
    expect(teacherId).toBeTruthy();
  });

  it('creates a direct conversation and sends message', async () => {
    const convo = await request(app.getHttpServer())
      .post(`${baseUrl}/messages/conversations/direct`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ participantId: teacherId })
      .expect(201);

    conversationId = convo.body._id;
    expect(conversationId).toBeTruthy();

    const message = await request(app.getHttpServer())
      .post(`${baseUrl}/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'Hello' })
      .expect(201);

    expect(message.body._id).toBeTruthy();
  });

  it('lists conversations and messages', async () => {
    const conversations = await request(app.getHttpServer())
      .get(`${baseUrl}/messages/conversations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(conversations.body)).toBe(true);

    const messages = await request(app.getHttpServer())
      .get(`${baseUrl}/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(messages.body.items)).toBe(true);
  });

  it('creates room and session', async () => {
    const room = await request(app.getHttpServer())
      .post(`${baseUrl}/planning/rooms`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Salle-${Date.now()}`,
        capacity: 30,
      })
      .expect(201);

    roomId = room.body._id;
    expect(roomId).toBeTruthy();

    const session = await request(app.getHttpServer())
      .post(`${baseUrl}/planning/sessions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        date: '2026-05-20',
        startTime: '09:00',
        endTime: '10:00',
        groupId,
        teacherId,
        roomId,
        label: 'Math',
      })
      .expect(201);

    expect(session.body._id).toBeTruthy();
  });

  it('lists planning sessions', async () => {
    const list = await request(app.getHttpServer())
      .get(`${baseUrl}/planning/sessions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThan(0);
  });

  it('creates and reads a student', async () => {
    const year = new Date().getFullYear();
    const studentNumber = `ML103DJ${year}${Date.now().toString().slice(-4)}`;
    const student = await request(app.getHttpServer())
      .post(`${baseUrl}/students`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        studentNumber,
        gender: 'male',
        birthDate: '2004-03-15',
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

  it('creates subject, evaluation and grades', async () => {
    const subject = await request(app.getHttpServer())
      .post(`${baseUrl}/notes/subjects`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Math-${Date.now()}`,
        code: 'MATH',
        coefficient: 2,
        levelId,
      })
      .expect(201);

    subjectId = subject.body._id;
    expect(subjectId).toBeTruthy();

    const evaluation = await request(app.getHttpServer())
      .post(`${baseUrl}/notes/evaluations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'DS1',
        date: '2026-06-12',
        subjectId,
        groupId,
        maxScore: 20,
      })
      .expect(201);

    evaluationId = evaluation.body._id;
    expect(evaluationId).toBeTruthy();

    await request(app.getHttpServer())
      .post(`${baseUrl}/notes/grades/bulk`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        evaluationId,
        grades: [{ studentId, score: 15 }],
      })
      .expect(201);
  });

  it('gets student notes summary', async () => {
    const summary = await request(app.getHttpServer())
      .get(`${baseUrl}/notes/students/${studentId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(summary.body.student).toBeTruthy();
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
