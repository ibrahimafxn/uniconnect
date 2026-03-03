import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotesApi } from '../../core/api/notes.api';
import { AcademicApi } from '../../core/api/academic.api';
import { AuthService } from '../../core/auth.service';
import { combineLatest, map, of, switchMap, tap } from 'rxjs';

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

  levels$ = this.academic.listLevels();
  groups$ = this.academic.listGroups();

  subjectForm = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    coefficient: [1, [Validators.required, Validators.min(0.1)]],
    levelId: ['', Validators.required],
  });

  evaluationForm = this.fb.group({
    title: ['', Validators.required],
    date: ['', Validators.required],
    subjectId: ['', Validators.required],
    groupId: ['', Validators.required],
    maxScore: [20, [Validators.required, Validators.min(1)]],
  });

  gradeForm = this.fb.group({
    evaluationId: ['', Validators.required],
    groupId: ['', Validators.required],
  });

  subjects$ = this.notes.listSubjects();
  evaluations$ = this.notes.listEvaluations();

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

  summary$ = this.isAdmin || this.isTeacher ? of(null) : this.notes.mySummary();

  refresh() {
    this.subjects$ = this.notes.listSubjects();
    this.evaluations$ = this.notes.listEvaluations();
  }

  createSubject() {
    if (this.subjectForm.invalid) return;
    this.notes.createSubject(this.subjectForm.value as any).subscribe(() => {
      this.subjectForm.reset({ coefficient: 1 });
      this.refresh();
    });
  }

  createEvaluation() {
    if (this.evaluationForm.invalid) return;
    this.notes.createEvaluation(this.evaluationForm.value as any).subscribe(() => {
      this.evaluationForm.reset({ maxScore: 20 });
      this.refresh();
    });
  }

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

  loadSummary(studentId: string) {
    this.summary$ = this.notes.studentSummary(studentId);
  }
}
