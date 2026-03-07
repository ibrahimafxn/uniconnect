import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotesApi } from '../../core/api/notes.api';
import { AcademicApi } from '../../core/api/academic.api';
import { AuthService } from '../../core/auth.service';
import { combineLatest, map, of, switchMap } from 'rxjs';

export type NotesTab = 'ue' | 'subjects' | 'evaluations' | 'grades' | 'results';

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

  // === TABS ===
  activeTab: NotesTab = this.isAdmin ? 'ue' : this.isAdmin || this.isTeacher ? 'evaluations' : 'results';

  // === DRAWER ===
  drawerOpen = false;
  drawerTitle = '';
  drawerMode: 'ue' | 'subject' | 'evaluation' | null = null;

  openDrawer(mode: 'ue' | 'subject' | 'evaluation', title: string) {
    this.drawerMode = mode;
    this.drawerTitle = title;
    this.drawerOpen = true;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.drawerMode = null;
    this.cancelEditUE();
    this.cancelEditSubject();
    this.cancelEditEvaluation();
  }

  // === DATA ===
  levels$ = this.academic.listLevels();
  semesters$ = this.academic.listSemesters();
  groups$ = this.academic.listGroups();

  ue$ = this.notes.listUE();
  subjects$ = this.notes.listSubjects();
  evaluations$ = this.notes.listEvaluations();

  // === UE FORM ===
  editingUEId: string | null = null;

  ueForm = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    ects: [3, [Validators.required, Validators.min(1)]],
    levelId: ['', Validators.required],
    semesterId: [''],
  });

  selectUEForEdit(ue: any) {
    this.editingUEId = ue._id;
    this.ueForm.setValue({
      name: ue.name ?? '',
      code: ue.code ?? '',
      ects: ue.ects ?? 3,
      levelId: ue.levelId ?? '',
      semesterId: ue.semesterId ?? '',
    });
    this.openDrawer('ue', "Modifier l'UE");
  }

  cancelEditUE() {
    this.editingUEId = null;
    this.ueForm.reset({ ects: 3 });
  }

  createUE() {
    if (this.ueForm.invalid) return;
    const val = this.ueForm.value as any;
    const payload: any = { name: val.name, ects: val.ects, levelId: val.levelId };
    if (val.code) payload.code = val.code;
    if (val.semesterId) payload.semesterId = val.semesterId;

    const obs = this.editingUEId
      ? this.notes.updateUE(this.editingUEId, payload)
      : this.notes.createUE(payload);
    obs.subscribe(() => {
      this.cancelEditUE();
      this.refresh();
      this.closeDrawer();
    });
  }

  deleteUE(id: string) {
    this.notes.deleteUE(id).subscribe(() => this.refresh());
  }

  // === SUBJECT FORM ===
  editingSubjectId: string | null = null;

  subjectForm = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    coefficient: [1, [Validators.required, Validators.min(0.1)]],
    levelId: ['', Validators.required],
    ueId: [''],
  });

  selectSubjectForEdit(s: any) {
    this.editingSubjectId = s._id;
    this.subjectForm.setValue({
      name: s.name ?? '',
      code: s.code ?? '',
      coefficient: s.coefficient ?? 1,
      levelId: s.levelId ?? '',
      ueId: s.ueId ?? '',
    });
    this.openDrawer('subject', 'Modifier la matière (ECUE)');
  }

  cancelEditSubject() {
    this.editingSubjectId = null;
    this.subjectForm.reset({ coefficient: 1 });
  }

  createSubject() {
    if (this.subjectForm.invalid) return;
    const val = this.subjectForm.value as any;
    const payload: any = {
      name: val.name,
      coefficient: val.coefficient,
      levelId: val.levelId,
    };
    if (val.code) payload.code = val.code;
    if (val.ueId) payload.ueId = val.ueId;

    const obs = this.editingSubjectId
      ? this.notes.updateSubject(this.editingSubjectId, payload)
      : this.notes.createSubject(payload);
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
    this.openDrawer('evaluation', "Modifier l'évaluation");
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

  semesterName(semesters: any[] | null, id: string): string {
    if (!id) return '—';
    return semesters?.find((s) => s._id === id)?.name ?? '—';
  }

  ueName(ues: any[] | null, id: string): string {
    if (!id) return '—';
    return ues?.find((u) => u._id === id)?.name ?? '—';
  }

  averageClass(avg: number | null): string {
    if (avg === null) return '';
    return avg >= 10 ? 'avg-pass' : 'avg-fail';
  }

  refresh() {
    this.ue$ = this.notes.listUE();
    this.subjects$ = this.notes.listSubjects();
    this.evaluations$ = this.notes.listEvaluations();
  }

  private fmtDate(value: string | Date | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
}
