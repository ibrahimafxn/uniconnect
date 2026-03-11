import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NotesApi, Evaluation, Subject} from '../../../core/api/notes.api';
import {AcademicApi} from '../../../core/api/academic.api';

type Student = {_id: string; firstName: string; lastName: string; studentNumber?: string};
type GradeEntry = {studentId: string; score: number | null; comment: string};

@Component({
  selector: 'app-teacher-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-notes.component.html',
  styleUrls: ['./teacher-notes.component.scss'],
})
export class TeacherNotesComponent {
  private readonly notes = inject(NotesApi);
  private readonly academic = inject(AcademicApi);
  private readonly fb = inject(FormBuilder);

  groups$ = this.academic.listGroups();

  constructor() {
    this.academic.listGroups().subscribe({
      next: (r: any) => { this.groups = r?.items ?? r ?? []; },
      error: () => {},
    });
  }
  subjects$ = this.notes.listSubjects();
  groups: Array<{_id: string; name: string; [k: string]: any}> = [];

  selectedGroupId: string | null = null;
  selectedSubjectId: string | null = null;
  selectedEvaluation: Evaluation | null = null;

  evaluations: Evaluation[] = [];
  students: Student[] = [];
  gradeEntries: GradeEntry[] = [];

  saving = false;
  saveSuccess = false;
  saveError: string | null = null;
  showEvalForm = false;
  loadingGrades = false;
  deletingEvalId: string | null = null;

  scoreErrors: Record<string, string> = {};

  compactMode = this.loadCompactMode();
  ultraCompactMode = this.loadUltraCompactMode();

  evalForm = this.fb.group({
    title: ['', Validators.required],
    date: ['', Validators.required],
    subjectId: ['', Validators.required],
    maxScore: [20, [Validators.required, Validators.min(1)]],
  });

  saveCompactMode() {
    if (!this.compactMode) {
      this.ultraCompactMode = false;
      this.saveUltraCompactMode(false);
    }
    try {
      localStorage.setItem('ui.compactMode', String(!!this.compactMode));
    } catch {
      // ignore storage errors
    }
  }

  saveUltraCompactMode(forceValue?: boolean) {
    if (typeof forceValue === 'boolean') {
      this.ultraCompactMode = forceValue;
    }
    if (this.ultraCompactMode) {
      this.compactMode = true;
      try {
        localStorage.setItem('ui.compactMode', 'true');
      } catch {
        // ignore storage errors
      }
    }
    try {
      localStorage.setItem('ui.ultraCompactMode', String(!!this.ultraCompactMode));
    } catch {
      // ignore storage errors
    }
  }

  private loadCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.compactMode') ?? localStorage.getItem('student.compactMode');
      return raw === 'true';
    } catch {
      return false;
    }
  }

  private loadUltraCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.ultraCompactMode') ?? localStorage.getItem('student.ultraCompactMode');
      return raw === 'true';
    } catch {
      return false;
    }
  }

  selectGroup(groupId: string) {
    this.selectedGroupId = groupId;
    this.selectedEvaluation = null;
    this.gradeEntries = [];
    this.evaluations = [];
    this.students = [];
    this.showEvalForm = false;

    this.notes.listGroupStudents(groupId).subscribe((s: any[]) => {
      this.students = s;
    });
    this.loadEvaluations();
  }

  loadEvaluations() {
    if (!this.selectedGroupId) return;
    this.notes.listEvaluations(this.selectedGroupId, this.selectedSubjectId ?? undefined)
      .subscribe((evals) => (this.evaluations = evals));
  }

  filterBySubject(subjectId: string) {
    this.selectedSubjectId = subjectId || null;
    this.selectedEvaluation = null;
    this.gradeEntries = [];
    this.loadEvaluations();
  }

  selectEvaluation(eval_: Evaluation) {
    this.selectedEvaluation = eval_;
    this.gradeEntries = this.students.map((s) => ({
      studentId: s._id,
      score: null,
      comment: '',
    }));
    this.loadingGrades = true;

    this.notes.listGrades(eval_._id).subscribe({
      next: (grades) => {
        for (const g of grades) {
          const entry = this.gradeEntries.find((e) => e.studentId === g.studentId);
          if (entry) {
            entry.score = g.score;
            entry.comment = g.comment ?? '';
          }
        }
        this.loadingGrades = false;
      },
      error: () => {
        this.loadingGrades = false;
      },
    });
  }

  get gradedCount(): number {
    return this.gradeEntries.filter((e) => e.score !== null).length;
  }

  createEvaluation() {
    if (this.evalForm.invalid || !this.selectedGroupId) return;
    const v = this.evalForm.value;
    this.notes.createEvaluation({
      title: v.title!,
      date: v.date!,
      subjectId: v.subjectId!,
      groupId: this.selectedGroupId,
      maxScore: v.maxScore!,
    }).subscribe(() => {
      this.evalForm.reset({maxScore: 20});
      this.showEvalForm = false;
      this.loadEvaluations();
    });
  }

  groupName(groupId: string): string {
    return this.groups.find(g => g._id === groupId)?.name ?? groupId;
  }

  deleteEvaluation(eval_: Evaluation) {
    if (!confirm(`Supprimer l'évaluation "${eval_.title}" ? Cette action est irréversible.`)) return;
    this.deletingEvalId = eval_._id;
    this.notes.deleteEvaluation(eval_._id).subscribe({
      next: () => {
        this.deletingEvalId = null;
        if (this.selectedEvaluation?._id === eval_._id) {
          this.selectedEvaluation = null;
          this.gradeEntries = [];
        }
        this.loadEvaluations();
      },
      error: () => { this.deletingEvalId = null; },
    });
  }

  updateScore(studentId: string, score: string) {
    const entry = this.gradeEntries.find((e) => e.studentId === studentId);
    if (!entry) return;
    const parsed = score === '' ? null : parseFloat(score);
    const maxScore = this.selectedEvaluation?.maxScore ?? 20;
    if (parsed !== null && parsed > maxScore) {
      this.scoreErrors[studentId] = `Max : ${maxScore}`;
      entry.score = maxScore;
    } else {
      delete this.scoreErrors[studentId];
      entry.score = parsed;
    }
  }

  updateComment(studentId: string, comment: string) {
    const entry = this.gradeEntries.find((e) => e.studentId === studentId);
    if (entry) entry.comment = comment;
  }

  saveGrades() {
    if (!this.selectedEvaluation) return;
    this.saving = true;
    this.saveSuccess = false;
    this.saveError = null;

    const grades = this.gradeEntries
      .filter((e) => e.score !== null)
      .map((e) => ({studentId: e.studentId, score: e.score!, comment: e.comment || undefined}));

    this.notes.upsertGrades(this.selectedEvaluation._id, grades).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 3000);
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Erreur lors de la sauvegarde.';
      },
    });
  }

  studentName(s: Student): string {
    return `${s.firstName} ${s.lastName}`;
  }

  gradeEntry(studentId: string): GradeEntry | undefined {
    return this.gradeEntries.find((e) => e.studentId === studentId);
  }

  subjectName(subjects: Subject[] | null, subjectId: string): string {
    if (!subjects) return subjectId;
    return subjects.find((s) => s._id === subjectId)?.name ?? subjectId;
  }
}
