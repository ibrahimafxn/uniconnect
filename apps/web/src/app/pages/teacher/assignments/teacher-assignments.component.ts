import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AssignmentsApi, Assignment, Submission} from '../../../core/api/assignments.api';
import {AcademicApi} from '../../../core/api/academic.api';
import {NotesApi} from '../../../core/api/notes.api';
import {StudentsApi} from '../../../core/api/students.api';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-assignments.component.html',
  styleUrls: ['./teacher-assignments.component.scss'],
})
export class TeacherAssignmentsComponent implements OnInit {
  private readonly api      = inject(AssignmentsApi);
  private readonly academic = inject(AcademicApi);
  private readonly notes    = inject(NotesApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly fb       = inject(FormBuilder);

  compactMode     = this.loadPref('ui.compactMode');
  ultraCompactMode = this.loadPref('ui.ultraCompactMode');

  // ── Data ────────────────────────────────────────────────────────────────────
  groups$   = this.academic.listGroups();
  subjects$ = this.notes.listSubjects();

  groupsMap: Record<string, string> = {};
  studentsMap: Record<string, string> = {};

  assignments: Assignment[] = [];
  loadingAssignments = false;

  selectedAssignment: Assignment | null = null;
  submissions: Submission[] = [];
  loadingSubmissions = false;

  // ── Filters ─────────────────────────────────────────────────────────────────
  filterGroupId   = '';
  filterSubjectId = '';

  // ── Create form ─────────────────────────────────────────────────────────────
  drawerOpen  = false;
  drawerTitle = '';
  saveError: string | null = null;
  saveSuccess = false;
  assignmentFile: File | null = null;

  form = this.fb.group({
    title:       ['', Validators.required],
    description: [''],
    groupId:     ['', Validators.required],
    subjectId:   [''],
    dueDate:     ['', Validators.required],
  });

  // ── Review form ─────────────────────────────────────────────────────────────
  reviewDrawerOpen = false;
  reviewingSubmission: Submission | null = null;
  reviewSaveError: string | null = null;
  reviewSaving = false;

  reviewForm = this.fb.group({
    score:    [null as number | null],
    feedback: [''],
    status:   ['reviewed'],
  });

  ngOnInit() {
    this.loadAssignments();
    this.groups$.subscribe(result => {
      this.groupsMap = {};
      for (const g of result.items) this.groupsMap[g._id] = g.name;
    });
  }

  // ── Load ────────────────────────────────────────────────────────────────────
  loadAssignments() {
    this.loadingAssignments = true;
    const params: any = {};
    if (this.filterGroupId)   params.groupId   = this.filterGroupId;
    if (this.filterSubjectId) params.subjectId = this.filterSubjectId;
    this.api.list(params).subscribe({
      next: (list) => { this.assignments = list; this.loadingAssignments = false; },
      error: ()    => { this.loadingAssignments = false; },
    });
  }

  selectAssignment(a: Assignment) {
    this.selectedAssignment = a;
    this.loadSubmissions(a._id);
    this.loadStudentsForGroup(a.groupId);
  }

  loadStudentsForGroup(groupId: string) {
    this.studentsApi.listStudents('', 1, 500).subscribe({
      next: (result) => {
        this.studentsMap = {};
        for (const s of result.items) {
          if (s.groupId === groupId) {
            this.studentsMap[s._id] = `${s.firstName} ${s.lastName}`;
          }
        }
      },
    });
  }

  loadSubmissions(assignmentId: string) {
    this.loadingSubmissions = true;
    this.submissions = [];
    this.api.listSubmissions(assignmentId).subscribe({
      next: (list) => { this.submissions = list; this.loadingSubmissions = false; },
      error: ()    => { this.loadingSubmissions = false; },
    });
  }

  back() {
    this.selectedAssignment = null;
    this.submissions = [];
    this.studentsMap = {};
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  openCreate() {
    this.form.reset();
    this.assignmentFile = null;
    this.saveError = null;
    this.saveSuccess = false;
    this.drawerTitle = 'Nouveau devoir';
    this.drawerOpen = true;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.assignmentFile = input.files?.[0] ?? null;
  }

  save() {
    if (this.form.invalid) return;
    this.saveError = null;
    const v = this.form.value as any;
    const payload = {
      title:       v.title,
      description: v.description ?? undefined,
      groupId:     v.groupId,
      subjectId:   v.subjectId ?? undefined,
      dueDate:     v.dueDate,
    };
    this.api.create(payload, this.assignmentFile ?? undefined).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.drawerOpen = false;
        this.loadAssignments();
      },
      error: (err) => { this.saveError = err?.error?.message ?? 'Erreur lors de la création.'; },
    });
  }

  // ── Review ──────────────────────────────────────────────────────────────────
  openReview(sub: Submission) {
    this.reviewingSubmission = sub;
    this.reviewSaveError = null;
    this.reviewForm.setValue({
      score:    sub.score ?? null,
      feedback: sub.feedback ?? '',
      status:   sub.status === 'submitted' ? 'reviewed' : sub.status,
    });
    this.reviewDrawerOpen = true;
  }

  saveReview() {
    if (!this.reviewingSubmission) return;
    this.reviewSaving = true;
    this.reviewSaveError = null;
    const v = this.reviewForm.value as any;
    const payload: any = {status: v.status};
    if (v.score !== null && v.score !== '') payload.score = +v.score;
    if (v.feedback) payload.feedback = v.feedback;
    this.api.updateSubmission(this.reviewingSubmission._id, payload).subscribe({
      next: (updated) => {
        this.reviewSaving = false;
        this.reviewDrawerOpen = false;
        if (this.selectedAssignment) this.loadSubmissions(this.selectedAssignment._id);
      },
      error: (err) => {
        this.reviewSaving = false;
        this.reviewSaveError = err?.error?.message ?? 'Erreur lors de la correction.';
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  groupName(id: string)  { return this.groupsMap[id] ?? id; }
  studentName(id: string) { return this.studentsMap[id] ?? id; }

  downloadUrl(id: string)        { return this.api.downloadSubmissionUrl(id); }
  assignmentDownloadUrl(id: string) { return this.api.downloadAssignmentUrl(id); }

  statusLabel(status: string) {
    const map: Record<string, string> = {submitted: 'Rendu', reviewed: 'Corrigé', late: 'En retard'};
    return map[status] ?? status;
  }

  statusClass(status: string) {
    return {submitted: 'badge-blue', reviewed: 'badge-green', late: 'badge-red'}[status] ?? '';
  }

  isPast(dueDate: string) { return new Date(dueDate) < new Date(); }
  countByStatus(status: string) { return this.submissions.filter(s => s.status === status).length; }

  saveCompactMode() {
    if (!this.compactMode) { this.ultraCompactMode = false; this.savePref('ui.ultraCompactMode', false); }
    this.savePref('ui.compactMode', this.compactMode);
  }
  saveUltraCompactMode(v?: boolean) {
    if (typeof v === 'boolean') this.ultraCompactMode = v;
    if (this.ultraCompactMode) { this.compactMode = true; this.savePref('ui.compactMode', true); }
    this.savePref('ui.ultraCompactMode', this.ultraCompactMode);
  }
  private loadPref(key: string) { try { return localStorage.getItem(key) === 'true'; } catch { return false; } }
  private savePref(key: string, v: boolean) { try { localStorage.setItem(key, String(v)); } catch {} }
}
