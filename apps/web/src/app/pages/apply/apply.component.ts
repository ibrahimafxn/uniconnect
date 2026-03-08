import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, of } from 'rxjs';
import { ApplicationsApi } from '../../core/api/applications.api';
import { AcademicApi } from '../../core/api/academic.api';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss'],
})
export class ApplyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly applications = inject(ApplicationsApi);
  private readonly academic = inject(AcademicApi);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: ['female', Validators.required],
    birthDate: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
    programId: ['', Validators.required],
    offerId: ['', Validators.required],
    academicYearId: ['', Validators.required],
  });

  lookupForm = this.fb.group({
    trackingCode: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  offers$ = this.academic.listOffers(1, 200);
  programs$ = this.academic.listPrograms(1, 200);
  years$ = this.academic.listYears(1, 50);
  levels$ = this.academic.listLevels(1, 200);

  offerOptions$ = combineLatest([this.offers$, this.programs$, this.years$, this.levels$]).pipe(
    map(([offers, programs, years, levels]) => {
      return offers.items.map((offer) => {
        const program = programs.items.find((p) => p._id === offer.programId);
        const year = years.items.find((y) => y._id === offer.academicYearId);
        const level = levels.items.find((l) => l._id === offer.levelId);
        return {
          id: offer._id,
          label: `${program?.name ?? 'Programme'} — ${level?.name ?? 'Niveau'} — ${year?.name ?? ''}`,
          programId: offer.programId,
          academicYearId: offer.academicYearId,
        };
      });
    }),
  );

  created: any = null;
  lookupResult: any = null;
  offerOptionsCache: Array<{ id: string; programId: string; academicYearId: string }> = [];

  constructor() {
    this.offerOptions$.subscribe((opts) => {
      this.offerOptionsCache = opts;
    });
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.value as any;
    this.applications.createPublic({
      ...raw,
      submit: true,
    }).subscribe((res) => {
      this.created = res;
    });
  }

  saveDraft() {
    if (this.form.invalid) return;
    const raw = this.form.value as any;
    this.applications.createPublic({
      ...raw,
      submit: false,
    }).subscribe((res) => {
      this.created = res;
    });
  }

  uploadDocument(file?: File, label?: string) {
    if (!file || !this.created?.trackingCode || !this.created?.email) return;
    this.applications.uploadPublicDocument(this.created.trackingCode, this.created.email, file, label).subscribe();
  }

  lookup() {
    if (this.lookupForm.invalid) return;
    const raw = this.lookupForm.value as any;
    this.applications.getPublic(raw.trackingCode, raw.email).subscribe((res) => {
      this.lookupResult = res;
    });
  }

  onOfferChange(offerId: string) {
    const match = this.offerOptionsCache.find((o) => o.id === offerId);
    if (!match) return;
    this.form.patchValue({ programId: match.programId, academicYearId: match.academicYearId });
  }
}
