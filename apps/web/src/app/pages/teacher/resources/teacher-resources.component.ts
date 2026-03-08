import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResourcesApi, Resource } from '../../../core/api/resources.api';
import { AcademicApi } from '../../../core/api/academic.api';
import { PlanningApi } from '../../../core/api/planning.api';
import { AuthService } from '../../../core/auth.service';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-teacher-resources',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './teacher-resources.component.html',
  styleUrls: ['./teacher-resources.component.scss'],
})
export class TeacherResourcesComponent {
  private readonly api = inject(ResourcesApi);
  private readonly academic = inject(AcademicApi);
  private readonly planning = inject(PlanningApi);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly isAdmin = ['admin', 'super_admin'].includes(this.auth.getUserRole() ?? '');
  readonly isTeacher = ['teacher', 'external'].includes(this.auth.getUserRole() ?? '');

  groups$ = this.academic.listGroups();
  resources$ = this.api.list();

  uploadForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    groupId: [''],
    sessionId: [''],
  });

  selectedFile: File | null = null;
  uploading = false;
  uploadError = '';
  uploadSuccess = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  upload() {
    if (!this.selectedFile || this.uploadForm.invalid) return;
    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = false;

    const fd = new FormData();
    fd.append('file', this.selectedFile);
    const v = this.uploadForm.value;
    if (v.title) fd.append('title', v.title);
    if (v.description) fd.append('description', v.description);
    if (v.groupId) fd.append('groupId', v.groupId);
    if (v.sessionId) fd.append('sessionId', v.sessionId);

    this.api.upload(fd).subscribe({
      next: () => {
        this.uploading = false;
        this.uploadSuccess = true;
        this.uploadForm.reset();
        this.selectedFile = null;
        this.refresh();
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = err?.error?.message ?? 'Erreur lors de l\'upload.';
      },
    });
  }

  download(resource: Resource) {
    window.open(this.api.getDownloadUrl(resource._id), '_blank');
  }

  delete(id: string) {
    this.api.delete(id).subscribe(() => this.refresh());
  }

  filterByGroup(groupId: string) {
    this.resources$ = this.api.list(undefined, groupId || undefined);
  }

  refresh() {
    this.resources$ = this.api.list();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
