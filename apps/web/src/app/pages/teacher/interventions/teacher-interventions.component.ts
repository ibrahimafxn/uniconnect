import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterventionApi, InterventionSheet } from '../../../core/api/intervention.api';

@Component({
  selector: 'app-teacher-interventions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-interventions.component.html',
  styleUrls: ['./teacher-interventions.component.scss'],
})
export class TeacherInterventionsComponent {
  private readonly api = inject(InterventionApi);

  sheets$ = this.api.list();

  // Formulaire nouvelle feuille
  draft = {
    period: '',
    hoursCM: 0,
    hoursTD: 0,
    hoursTP: 0,
    hourlyRate: 0,
    currency: 'XOF',
    comment: '',
  };

  creating = false;
  createError = '';
  createSuccess = false;

  get totalHours() {
    return this.draft.hoursCM + this.draft.hoursTD + this.draft.hoursTP;
  }

  get totalAmount() {
    return this.totalHours * this.draft.hourlyRate;
  }

  create() {
    if (!this.draft.period || this.draft.hourlyRate <= 0) return;
    this.creating = true;
    this.createError = '';
    this.createSuccess = false;

    this.api.create(this.draft).subscribe({
      next: () => {
        this.creating = false;
        this.createSuccess = true;
        this.draft = { period: '', hoursCM: 0, hoursTD: 0, hoursTP: 0, hourlyRate: 0, currency: 'XOF', comment: '' };
        this.refresh();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err?.error?.message ?? 'Erreur lors de la création.';
      },
    });
  }

  submit(id: string) {
    this.api.submit(id).subscribe(() => this.refresh());
  }

  refresh() {
    this.sheets$ = this.api.list();
  }

  statusLabel(s: string): string {
    return ({ draft: 'Brouillon', submitted: 'Soumise', validated: 'Validée', paid: 'Payée' } as any)[s] ?? s;
  }

  statusClass(s: string): string {
    return ({ draft: 'badge-neutral', submitted: 'badge-warning', validated: 'badge-info', paid: 'badge-success' } as any)[s] ?? '';
  }
}
