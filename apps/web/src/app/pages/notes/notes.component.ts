import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotesApi } from '../../core/api/notes.api';
import { AcademicApi } from '../../core/api/academic.api';
import { AuthService } from '../../core/auth.service';
import { combineLatest, map, of, switchMap } from 'rxjs';

export type NotesTab = 'subjects' | 'evaluations' | 'grades' | 'results' | 'claims';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
})
export class NotesComponent {
  private readonly notes = inject(NotesApi);
  private readonly academic = inject(AcademicApi);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly isAdmin = ['admin', 'super_admin'].includes(this.auth.getUserRole() ?? '');
  readonly isTeacher = ['teacher', 'external'].includes(this.auth.getUserRole() ?? '');
  readonly isStudent = (this.auth.getUserRole() ?? '') === 'student';

  // === TABS ===
  activeTab: NotesTab = this.isAdmin ? 'subjects' : this.isTeacher ? 'evaluations' : 'results';

  // === DRAWER ===
  drawerOpen = false;
  drawerTitle = '';
  drawerMode: 'subject' | 'evaluation' | null = null;

  openDrawer(mode: 'subject' | 'evaluation', title: string) {
    this.drawerMode = mode;
    this.drawerTitle = title;
    this.drawerOpen = true;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.drawerMode = null;
    this.cancelEditSubject();
    this.cancelEditEvaluation();
  }

  // === DATA ===
  levels$ = this.academic.listLevels();
  groups$ = this.academic.listGroups();

  subjects$ = this.notes.listSubjects();
  evaluations$ = this.notes.listEvaluations();

  // === SUBJECT FORM ===
  editingSubjectId: string | null = null;

  subjectForm = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    coefficient: [1, [Validators.required, Validators.min(0.1)]],
    levelId: ['', Validators.required],
  });

  selectSubjectForEdit(s: any) {
    this.editingSubjectId = s._id;
    this.subjectForm.setValue({
      name: s.name ?? '',
      code: s.code ?? '',
      coefficient: s.coefficient ?? 1,
      levelId: s.levelId ?? '',
    });
    this.openDrawer('subject', 'Modifier la matière');
  }

  cancelEditSubject() {
    this.editingSubjectId = null;
    this.subjectForm.reset({ coefficient: 1 });
  }

  createSubject() {
    if (this.subjectForm.invalid) return;
    const obs = this.editingSubjectId
      ? this.notes.updateSubject(this.editingSubjectId, this.subjectForm.value as any)
      : this.notes.createSubject(this.subjectForm.value as any);
    obs.subscribe(() => {
      this.cancelEditSubject();
      this.refresh();
      this.closeDrawer();
    });
  }

  deleteSubject(id: string) {
    this.notes.deleteSubject(id).subscribe(() => this.refresh());
  }

  // === EVALUATION FORM ===
  editingEvaluationId: string | null = null;

  evaluationForm = this.fb.group({
    title: ['', Validators.required],
    date: ['', Validators.required],
    subjectId: ['', Validators.required],
    groupId: ['', Validators.required],
    maxScore: [20, [Validators.required, Validators.min(1)]],
  });

  selectEvaluationForEdit(e: any) {
    this.editingEvaluationId = e._id;
    this.evaluationForm.setValue({
      title: e.title ?? '',
      date: this.fmtDate(e.date),
      subjectId: e.subjectId ?? '',
      groupId: e.groupId ?? '',
      maxScore: e.maxScore ?? 20,
    });
    this.openDrawer('evaluation', 'Modifier l\'évaluation');
  }

  cancelEditEvaluation() {
    this.editingEvaluationId = null;
    this.evaluationForm.reset({ maxScore: 20 });
  }

  createEvaluation() {
    if (this.evaluationForm.invalid) return;
    const obs = this.editingEvaluationId
      ? this.notes.updateEvaluation(this.editingEvaluationId, this.evaluationForm.value as any)
      : this.notes.createEvaluation(this.evaluationForm.value as any);
    obs.subscribe(() => {
      this.cancelEditEvaluation();
      this.refresh();
      this.closeDrawer();
    });
  }

  // === GRADES ===
  gradeForm = this.fb.group({
    evaluationId: ['', Validators.required],
    groupId: ['', Validators.required],
  });

  students$ = this.gradeForm.valueChanges.pipe(
    switchMap((value) => (value.groupId ? this.notes.listGroupStudents(value.groupId) : of([]))),
  );

  grades$ = this.gradeForm.valueChanges.pipe(
    switchMap((value) => (value.evaluationId ? this.notes.listGrades(value.evaluationId) : of([]))),
  );

  gradeEntries$ = combineLatest([this.students$, this.grades$]).pipe(
    map(([students, grades]) =>
      students.map((s) => {
        const existing = grades.find((g) => g.studentId === s._id);
        return { student: s, score: existing?.score ?? 0 };
      }),
    ),
  );

  saveGrades(entries: Array<{ student: any; score: number }>) {
    const evaluationId = this.gradeForm.value.evaluationId as string;
    if (!evaluationId) return;
    const items = entries.map((entry) => ({
      studentId: entry.student._id,
      score: Number(entry.score ?? 0),
    }));
    this.notes.upsertGrades(evaluationId, items).subscribe(() => {
      this.gradeForm.patchValue({});
    });
  }

  // === RESULTS ===
  summary$ = this.isAdmin || this.isTeacher ? of(null) : this.notes.mySummary();
  studentSearchId = '';

  loadSummary(studentId: string) {
    if (!studentId) return;
    this.summary$ = this.notes.studentSummary(studentId);
  }

  // === CLAIMS ===
  claimForm = this.fb.group({
    evaluationId: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
    requestedScore: [''],
  });

  myEvaluations$ = this.isStudent ? this.notes.listMyEvaluations() : of([]);
  myClaims$ = this.isStudent ? this.notes.listMyClaims() : of([]);
  claimsStatusFilter = '';
  claims$ = this.isAdmin ? this.notes.listClaims() : of([]);
  claimStatus: Record<string, string> = {};
  claimDecision: Record<string, string> = {};
  now = () => new Date().getTime();

  createClaim() {
    if (this.claimForm.invalid) return;
    const raw = this.claimForm.value as any;
    const requestedScore =
      raw.requestedScore !== undefined && raw.requestedScore !== ''
        ? Number(raw.requestedScore)
        : undefined;
    this.notes
      .createClaim({
        evaluationId: raw.evaluationId,
        reason: raw.reason,
        requestedScore,
      })
      .subscribe(() => {
        this.claimForm.reset();
        this.refreshMyClaims();
      });
  }

  refreshClaims() {
    if (!this.isAdmin) return;
    const status = this.claimsStatusFilter || undefined;
    this.claims$ = this.notes.listClaims(status as any);
  }

  refreshMyClaims() {
    if (!this.isStudent) return;
    this.myClaims$ = this.notes.listMyClaims();
  }

  saveClaim(id: string, currentStatus: string, currentDecision?: string) {
    const status = (this.claimStatus[id] ?? currentStatus) as any;
    const decisionNote = this.claimDecision[id] ?? currentDecision;
    this.notes.updateClaim(id, { status, decisionNote }).subscribe(() => this.refreshClaims());
  }

  isOverdue(deadlineAt?: string, status?: string) {
    if (!deadlineAt) return false;
    if (status === 'accepted' || status === 'rejected') return false;
    return new Date(deadlineAt).getTime() < this.now();
  }

  exportClaims() {
    if (!this.isAdmin) return;
    const status = this.claimsStatusFilter || undefined;
    this.notes.exportClaims(status as any).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'note-claims.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // === HELPERS ===
  subjectName(subjects: any[] | null, id: string): string {
    return subjects?.find((s) => s._id === id)?.name ?? id;
  }

  groupName(groups: any[] | null, id: string): string {
    return groups?.find((g) => g._id === id)?.name ?? id;
  }

  levelName(levels: any[] | null, id: string): string {
    return levels?.find((l) => l._id === id)?.name ?? id;
  }

  averageClass(avg: number | null): string {
    if (avg === null) return '';
    return avg >= 10 ? 'avg-pass' : 'avg-fail';
  }

  claimStudentName(claim: any): string {
    const student = claim?.studentId;
    if (student && typeof student === 'object') {
      return `${student.lastName ?? ''} ${student.firstName ?? ''}`.trim();
    }
    return '';
  }

  claimStudentNumber(claim: any): string {
    const student = claim?.studentId;
    if (student && typeof student === 'object') {
      return student.studentNumber ?? '';
    }
    return String(student ?? '');
  }

  claimEvaluationTitle(claim: any): string {
    const evaluation = claim?.evaluationId;
    if (evaluation && typeof evaluation === 'object') {
      return evaluation.title ?? '';
    }
    return String(evaluation ?? '');
  }

  refresh() {
    this.subjects$ = this.notes.listSubjects();
    this.evaluations$ = this.notes.listEvaluations();
    this.refreshClaims();
    this.refreshMyClaims();
  }

  private fmtDate(value: string | Date | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
}
