import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ResourcesApi, Resource} from '../../../core/api/resources.api';
import {AcademicApi} from '../../../core/api/academic.api';
import {NotesApi} from '../../../core/api/notes.api';
import {ConfirmService} from '../../../core/confirm.service';
import {take} from 'rxjs';

@Component({
  selector: 'app-teacher-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-resources.component.html',
  styleUrls: ['./teacher-resources.component.scss'],
})
export class TeacherResourcesComponent implements OnInit {
  private readonly api      = inject(ResourcesApi);
  private readonly academic = inject(AcademicApi);
  private readonly notes    = inject(NotesApi);
  private readonly confirm  = inject(ConfirmService);
  private readonly fb       = inject(FormBuilder);

  compactMode      = this.loadPref('ui.compactMode');
  ultraCompactMode = this.loadPref('ui.ultraCompactMode');

  groups$   = this.academic.listGroups();
  subjects$ = this.notes.listSubjects();

  resources: Resource[]  = [];
  loading = false;

  filterGroupId   = '';
  filterSubjectId = '';

  drawerOpen  = false;
  saveError: string | null = null;
  uploadFile: File | null  = null;
  uploading = false;

  form = this.fb.group({
    title:       ['', Validators.required],
    description: [''],
    groupId:     ['', Validators.required],
    subjectId:   [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.filterGroupId)   params.groupId   = this.filterGroupId;
    if (this.filterSubjectId) params.subjectId = this.filterSubjectId;
    this.api.list(params).subscribe({
      next: (list) => { this.resources = list; this.loading = false; },
      error: ()    => { this.loading = false; },
    });
  }

  openUpload() {
    this.form.reset();
    this.uploadFile = null;
    this.saveError = null;
    this.drawerOpen = true;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.uploadFile = input.files?.[0] ?? null;
  }

  upload() {
    if (this.form.invalid || !this.uploadFile) return;
    this.uploading = true;
    this.saveError = null;
    const v = this.form.value as any;
    const payload = {
      title:       v.title,
      description: v.description ?? undefined,
      groupId:     v.groupId,
      subjectId:   v.subjectId ?? undefined,
    };
    this.api.create(payload, this.uploadFile).subscribe({
      next: () => {
        this.uploading = false;
        this.drawerOpen = false;
        this.load();
      },
      error: (err) => {
        this.uploading = false;
        this.saveError = err?.error?.message ?? 'Erreur lors de l\'upload.';
      },
    });
  }

  delete(id: string) {
    this.confirm.open({title: 'Supprimer la ressource', message: 'Confirmer la suppression de cette ressource ?', danger: true, confirmLabel: 'Supprimer'})
      .pipe(take(1))
      .subscribe(ok => { if (ok) this.api.delete(id).subscribe(() => this.load()); });
  }

  downloadUrl(id: string) { return this.api.downloadUrl(id); }

  mimeIcon(mime: string) {
    if (mime.startsWith('image/')) return '🖼️';
    if (mime === 'application/pdf') return '📄';
    if (mime.includes('word')) return '📝';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📑';
    if (mime.includes('zip') || mime.includes('compressed')) return '🗜️';
    return '📁';
  }

  formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

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
