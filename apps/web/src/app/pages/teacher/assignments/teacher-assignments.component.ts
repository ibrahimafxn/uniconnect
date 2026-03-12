import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AssignmentsApi, Assignment, Submission} from '../../../core/api/assignments.api';
import {AcademicApi} from '../../../core/api/academic.api';
import {NotesApi} from '../../../core/api/notes.api';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-assignments.component.html',
  styleUrls: ['./teacher-assignments.component.scss'],
})
export class TeacherAssignmentsComponent implements OnInit {
  private readonly api    = inject(AssignmentsApi);
  private readonly academic = inject(AcademicApi);
  private readonly notes  = inject(NotesApi);
  private readonly fb     = inject(FormBuilder);

  compactMode     = this.loadPref('ui.compactMode');
  ultraCompactMode = this.loadPref('ui.ultraCompactMode');

  // ── Data ────────────────────────────────────────────────────────────────────
  groups$   = this.academic.listGroups();
  subjects$ = this.notes.listSubjects();

  assignments: Assignment[] = [];
  loadingAssignments = false;

  selectedAssignment: Assignment | null = null;
  submissions: Submission[] = [];
  loadingSubmissions = false;

  // ── Filters ─────────────────────────────────────────────────────────────────
  filterGroupId   = '';
  filterSubjectId = '';

  // ── Create / Edit form ───────────────────────────────────────────────────────
  drawerOpen    = false;
  drawerTitle   = '';
  editMode      = false;
  editingId: string | null = null;
  saveError: string | null = null;
  saveSuccess   = false;
  saving        = false;
  assignmentFile: File | null = null;

  form = this.fb.group({
    title:       ['', Validators.required],
    description: [''],
    groupId:     ['', Validators.required],
    subjectId:   [''],
    dueDate:     ['', Validators.required],
  });

  deleteError: string | null = null;

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
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  openCreate() {
    this.form.reset();
    this.assignmentFile = null;
    this.saveError = null;
    this.saveSuccess = false;
    this.saving = false;
    this.editMode = false;
    this.editingId = null;
    this.drawerTitle = 'Nouveau devoir';
    this.drawerOpen = true;
  }

  openEdit(a: Assignment, event: Event) {
    event.stopPropagation();
    this.form.setValue({
      title:       a.title,
      description: a.description ?? '',
      groupId:     a.groupId,
      subjectId:   a.subjectId ?? '',
      dueDate:     a.dueDate ? a.dueDate.slice(0, 10) : '',
    });
    this.assignmentFile = null;
    this.saveError = null;
    this.saveSuccess = false;
    this.saving = false;
    this.editMode = true;
    this.editingId = a._id;
    this.drawerTitle = 'Modifier le devoir';
    this.drawerOpen = true;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.assignmentFile = input.files?.[0] ?? null;
  }

  save() {
    if (this.form.invalid) return;
    this.saveError = null;
    this.saving = true;
    const v = this.form.value as any;
    if (this.editMode && this.editingId) {
      const payload: any = { title: v.title, description: v.description ?? undefined, groupId: v.groupId, subjectId: v.subjectId || undefined, dueDate: v.dueDate };
      this.api.update(this.editingId, payload).subscribe({
        next: () => { this.saving = false; this.drawerOpen = false; this.loadAssignments(); },
        error: (err) => { this.saving = false; this.saveError = err?.error?.message ?? 'Erreur lors de la modification.'; },
      });
    } else {
      const payload = { title: v.title, description: v.description ?? undefined, groupId: v.groupId, subjectId: v.subjectId ?? undefined, dueDate: v.dueDate };
      this.api.create(payload, this.assignmentFile ?? undefined).subscribe({
        next: () => { this.saving = false; this.saveSuccess = true; this.drawerOpen = false; this.loadAssignments(); },
        error: (err) => { this.saving = false; this.saveError = err?.error?.message ?? 'Erreur lors de la création.'; },
      });
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  deleteAssignment(a: Assignment, event: Event) {
    event.stopPropagation();
    if (!confirm(`Supprimer le devoir « ${a.title} » ? Cette action est irréversible.`)) return;
    this.deleteError = null;
    this.api.delete(a._id).subscribe({
      next: () => this.loadAssignments(),
      error: (err) => { this.deleteError = err?.error?.message ?? 'Erreur lors de la suppression.'; },
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
