import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JuryApi } from '../../../core/api/jury.api';
import { AcademicApi } from '../../../core/api/academic.api';
import { NotesApi } from '../../../core/api/notes.api';
import { of, switchMap } from 'rxjs';

type JuryEntry = {
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber?: string;
  decision: string;
  overallAverage?: number;
  ectsObtained: number;
  comment: string;
};

@Component({
  selector: 'app-teacher-jury',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-jury.component.html',
  styleUrls: ['./teacher-jury.component.scss'],
})
export class TeacherJuryComponent {
  private readonly jury = inject(JuryApi);
  private readonly academic = inject(AcademicApi);
  private readonly notes = inject(NotesApi);

  groups$ = this.academic.listGroups();

  selectedGroupId = '';
  session = '';
  entries: JuryEntry[] = [];
  saving = false;
  saved = false;
  saveError = '';

  decisions$ = this.jury.listDecisions();

  readonly decisionLabels: Record<string, string> = {
    admis: 'Admis(e)',
    ajourne: 'Ajourné(e)',
    redoublant: 'Redoublant(e)',
    admis_avec_dettes: 'Admis(e) avec dettes',
  };

  readonly mentionLabels: Record<string, string> = {
    passable: 'Passable (≥10)',
    assez_bien: 'Assez Bien (≥12)',
    bien: 'Bien (≥14)',
    tres_bien: 'Très Bien (≥16)',
  };

  loadSheet() {
    if (!this.selectedGroupId) return;
    this.jury.prepareSheet(this.selectedGroupId).subscribe((sheet) => {
      this.entries = sheet.students.map((s: any) => ({
        studentId: String(s._id),
        firstName: s.firstName,
        lastName: s.lastName,
        studentNumber: s.studentNumber,
        decision: 'admis',
        overallAverage: undefined,
        ectsObtained: 0,
        comment: '',
      }));
    });
  }

  save() {
    if (!this.selectedGroupId || !this.session || this.entries.length === 0) return;
    this.saving = true;
    this.saved = false;
    this.saveError = '';

    this.jury.bulkDecisions(this.selectedGroupId, this.session, this.entries).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        this.decisions$ = this.jury.listDecisions(this.session, this.selectedGroupId);
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err?.error?.message ?? 'Erreur lors de l\'enregistrement.';
      },
    });
  }

  decisionClass(d: string): string {
    const map: Record<string, string> = {
      admis: 'badge-success',
      admis_avec_dettes: 'badge-warning',
      ajourne: 'badge-danger',
      redoublant: 'badge-danger',
    };
    return map[d] ?? '';
  }
}
