import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {TeacherProfileApi} from '../../../core/api/teacher-profile.api';
import {AuthService} from '../../../core/auth.service';

@Component({
  selector: 'app-teacher-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-profile-page.component.html',
  styleUrls: ['./teacher-profile-page.component.scss'],
})
export class TeacherProfilePageComponent implements OnInit {
  private readonly api = inject(TeacherProfileApi);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly email = this.auth.getUserEmail() ?? '';
  readonly role = this.auth.getUserRole() ?? 'teacher';

  saving = false;
  saved = false;
  error: string | null = null;
  loaded = false;

  readonly gradeOptions = [
    {value: 'assistant', label: 'Assistant'},
    {value: 'maitre_conferences', label: 'Maître de conférences'},
    {value: 'professeur', label: 'Professeur'},
    {value: 'vacataire', label: 'Vacataire / Chargé de cours'},
    {value: 'autre', label: 'Autre'},
  ];

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    specialty: [''],
    grade: ['autre'],
    bio: [''],
    phone: [''],
    office: [''],
  });

  ngOnInit() {
    this.api.getMyProfile().subscribe({
      next: (profile) => {
        this.loaded = true;
        if (profile) {
          this.form.patchValue({
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            specialty: profile.specialty ?? '',
            grade: profile.grade ?? 'autre',
            bio: profile.bio ?? '',
            phone: profile.phone ?? '',
            office: profile.office ?? '',
          });
        }
      },
      error: () => {
        this.loaded = true;
      },
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.saved = false;
    this.error = null;

    this.api.upsertMyProfile(this.form.value as any).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.saving = false;
        this.error = 'Erreur lors de la sauvegarde.';
      },
    });
  }
}
