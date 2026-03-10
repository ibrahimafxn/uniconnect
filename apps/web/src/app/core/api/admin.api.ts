import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';

const BASE = 'http://localhost:3000/api';

export interface AdminUser {
  _id: string;
  email: string;
  role: string;
  suspended: boolean;
  createdAt: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ImportStudentRow {
  firstName: string;
  lastName: string;
  email?: string;
  gender: 'male' | 'female';
  birthDate: string;
  phone?: string;
  address?: string;
}

export interface ImportResult {
  jobId: string;
  total: number;
  successCount: number;
  errorCount: number;
  errors: {row: number; message: string; email?: string}[];
  credentials: {email: string; password: string; studentNumber: string}[];
}

export interface FeeInstallment {
  label: string;
  amount: number;
  dueDate: string;
}

export interface FeeTemplate {
  _id: string;
  label: string;
  offerId: string;
  totalAmount: number;
  currency: string;
  installments: FeeInstallment[];
  acceptedMethods: string[];
  isActive: boolean;
}

export interface FeeExemption {
  _id: string;
  studentId: string;
  academicYearId: string;
  type: 'partial' | 'total';
  percentage: number;
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface CalendarEvent {
  _id: string;
  academicYearId: string;
  type: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface FinancialReport {
  totalStudents: number;
  totalExpected: number;
  totalCollected: number;
  totalBalance: number;
  recoveryRate: number;
  exemptionCount: number;
  byPaymentMethod: Record<string, number>;
  currency: string;
}

export interface ExecutiveDashboard {
  activeAcademicYear: {id: string; name: string} | null;
  students: {total: number; active: number; byEnrollmentStatus: Record<string, number>};
  users: {total: number};
  programs: {total: number};
  offers: {total: number};
  finance: {totalExpected: number; totalCollected: number; totalBalance: number; recoveryRate: number; currency: string};
  recentActivity: any[];
  generatedAt: string;
}

export interface MesrsReport {
  academicYear: {id: string; name: string} | null;
  reportDate: string;
  totalStudents: number;
  byGender: {male: number; female: number};
  totalPrograms: number;
  totalOffers: number;
  enrollmentByStatus: Record<string, number>;
  offerBreakdown: {offerLabel: string; studentCount: number; capacity: number; fillRate: number | null}[];
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  from: string;
  secure?: boolean;
}

export interface EmailTemplate {
  key: string;
  subject: string;
  body: string;
}

export interface SystemParams {
  maxStudentsPerGroup: number;
  paymentGraceDays: number;
  supportEmail: string;
  maintenanceMode: boolean;
  maxUploadSizeMb: number;
}

export interface XlsxParseResult {
  rows: ImportStudentRow[];
  errors: {row: number; message: string}[];
}

@Injectable({providedIn: 'root'})
export class AdminApi {
  private readonly http = inject(HttpClient);

  // ── Users ────────────────────────────────────────────────────────────────────

  listUsers(params: {skip?: number; limit?: number; role?: string; q?: string; suspended?: boolean}) {
    const p: any = {skip: params.skip ?? 0, limit: params.limit ?? 50};
    if (params.role) p.role = params.role;
    if (params.q) p.q = params.q;
    if (params.suspended !== undefined) p.suspended = params.suspended;
    return this.http.get<{items: AdminUser[]; total: number}>(`${BASE}/admin/users`, {params: p});
  }

  suspendUser(id: string) {
    return this.http.patch<{success: boolean}>(`${BASE}/admin/users/${id}/suspend`, {});
  }

  reactivateUser(id: string) {
    return this.http.patch<{success: boolean}>(`${BASE}/admin/users/${id}/reactivate`, {});
  }

  resetPassword(id: string) {
    return this.http.patch<{tempPassword: string}>(`${BASE}/admin/users/${id}/reset-password`, {});
  }

  assignRole(id: string, role: string) {
    return this.http.patch<{success: boolean}>(`${BASE}/admin/users/${id}/role`, {role});
  }

  importStudents(offerId: string, groupId: string, rows: ImportStudentRow[]) {
    return this.http.post<ImportResult>(`${BASE}/admin/users/import-students`, {offerId, groupId, rows});
  }

  listAuditLogs(params: {skip?: number; limit?: number; action?: string; entity?: string}) {
    const p: any = {skip: params.skip ?? 0, limit: params.limit ?? 50};
    if (params.action) p.action = params.action;
    if (params.entity) p.entity = params.entity;
    return this.http.get<{items: any[]; total: number}>(`${BASE}/admin/users/audit-logs`, {params: p});
  }

  // ── Academic ─────────────────────────────────────────────────────────────────

  initializeYear(body: {
    name: string; startDate: string; endDate: string; isActive?: boolean;
    semesters: {name: string; startDate: string; endDate: string}[];
    offers: {programId: string; levelId: string; capacity: number}[];
  }) {
    return this.http.post<any>(`${BASE}/admin/academic/years/initialize`, body);
  }

  closeYear(id: string) {
    return this.http.patch<{success: boolean; closedYear: string; archivedStudents: number}>(
      `${BASE}/admin/academic/years/${id}/close`, {}
    );
  }

  getYearSummary(id: string) {
    return this.http.get<any>(`${BASE}/admin/academic/years/${id}/summary`);
  }

  updateOfferCapacity(offerId: string, capacity: number) {
    return this.http.patch<any>(`${BASE}/admin/academic/offers/${offerId}/capacity`, {capacity});
  }

  createCalendarEvent(body: {
    academicYearId: string; type: string; label: string; startDate: string; endDate: string; offerId?: string;
  }) {
    return this.http.post<CalendarEvent>(`${BASE}/admin/academic/calendar-events`, body);
  }

  listCalendarEvents(params: {academicYearId?: string; type?: string; skip?: number; limit?: number}) {
    const p: any = {skip: params.skip ?? 0, limit: params.limit ?? 100};
    if (params.academicYearId) p.academicYearId = params.academicYearId;
    if (params.type) p.type = params.type;
    return this.http.get<{items: CalendarEvent[]; total: number}>(`${BASE}/admin/academic/calendar-events`, {params: p});
  }

  deleteCalendarEvent(id: string) {
    return this.http.delete<{success: boolean}>(`${BASE}/admin/academic/calendar-events/${id}`);
  }

  // ── Finance ──────────────────────────────────────────────────────────────────

  createFeeTemplate(body: {
    label: string; offerId: string; totalAmount: number; currency?: string;
    installments: FeeInstallment[]; acceptedMethods?: string[];
  }) {
    return this.http.post<FeeTemplate>(`${BASE}/admin/finance/fee-templates`, body);
  }

  listFeeTemplates(offerId?: string) {
    const p: any = {skip: 0, limit: 100};
    if (offerId) p.offerId = offerId;
    return this.http.get<{items: FeeTemplate[]; total: number}>(`${BASE}/admin/finance/fee-templates`, {params: p});
  }

  updateFeeTemplate(id: string, body: Partial<FeeTemplate>) {
    return this.http.patch<FeeTemplate>(`${BASE}/admin/finance/fee-templates/${id}`, body);
  }

  applyFeeTemplate(id: string, studentIds: string[]) {
    return this.http.post<{applied: number; skipped: number}>(`${BASE}/admin/finance/fee-templates/${id}/apply`, {studentIds});
  }

  createExemption(body: {
    studentId: string; academicYearId: string; type: 'partial' | 'total'; percentage: number; reason: string;
  }) {
    return this.http.post<FeeExemption>(`${BASE}/admin/finance/exemptions`, body);
  }

  listExemptions(academicYearId?: string) {
    const p: any = {skip: 0, limit: 100};
    if (academicYearId) p.academicYearId = academicYearId;
    return this.http.get<{items: FeeExemption[]; total: number}>(`${BASE}/admin/finance/exemptions`, {params: p});
  }

  deleteExemption(id: string) {
    return this.http.delete<{success: boolean}>(`${BASE}/admin/finance/exemptions/${id}`);
  }

  getFinancialReport(academicYearId?: string) {
    const p: any = {};
    if (academicYearId) p.academicYearId = academicYearId;
    return this.http.get<FinancialReport>(`${BASE}/admin/finance/report`, {params: p});
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  getExecutiveDashboard() {
    return this.http.get<ExecutiveDashboard>(`${BASE}/admin/dashboard`);
  }

  getMesrsReport(academicYearId?: string) {
    const p: any = {};
    if (academicYearId) p.academicYearId = academicYearId;
    return this.http.get<MesrsReport>(`${BASE}/admin/dashboard/mesrs-report`, {params: p});
  }

  getSystemStatus() {
    return this.http.get<any>(`${BASE}/admin/dashboard/system-status`);
  }

  broadcastAnnouncement(body: {title: string; content: string; targetRoles?: string[]}) {
    return this.http.post<{success: boolean; recipientCount: number; sentAt: string}>(
      `${BASE}/admin/dashboard/announcements`, body
    );
  }

  // ── Global Config (UC-A06) ───────────────────────────────────────────────

  getSmtpConfig() {
    return this.http.get<SmtpConfig | null>(`${BASE}/admin/config/smtp`);
  }

  updateSmtpConfig(body: SmtpConfig) {
    return this.http.patch<SmtpConfig>(`${BASE}/admin/config/smtp`, body);
  }

  listEmailTemplates() {
    return this.http.get<EmailTemplate[]>(`${BASE}/admin/config/email-templates`);
  }

  upsertEmailTemplate(key: string, body: {subject: string; body: string}) {
    return this.http.post<EmailTemplate>(`${BASE}/admin/config/email-templates/${key}`, body);
  }

  deleteEmailTemplate(key: string) {
    return this.http.delete<{success: boolean}>(`${BASE}/admin/config/email-templates/${key}`);
  }

  getSystemParams() {
    return this.http.get<SystemParams>(`${BASE}/admin/config/system-params`);
  }

  updateSystemParams(body: Partial<SystemParams>) {
    return this.http.patch<SystemParams>(`${BASE}/admin/config/system-params`, body);
  }

  // ── XLSX import preview (UC-A02) ──────────────────────────────────────────

  createTeacher(body: {firstName: string; lastName: string; email: string; specialty?: string; grade?: string; bio?: string; phone?: string; office?: string}) {
    return this.http.post<{userId: string; email: string; tempPassword: string}>(
      `${BASE}/admin/users/create-teacher`, body
    );
  }

  parseXlsxFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<XlsxParseResult>(`${BASE}/admin/users/parse-xlsx`, fd);
  }
}
