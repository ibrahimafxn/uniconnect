import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teacher-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-export.component.html',
  styleUrls: ['./teacher-export.component.scss'],
})
export class TeacherExportComponent {
  private readonly apiBase = 'http://localhost:3000/api/planning/sessions/export';

  dateFrom = '';
  dateTo = '';

  get pdfUrl(): string {
    const p = new URLSearchParams();
    if (this.dateFrom) p.set('dateFrom', this.dateFrom);
    if (this.dateTo) p.set('dateTo', this.dateTo);
    const qs = p.toString() ? `?${p}` : '';
    return `${this.apiBase}/pdf${qs}`;
  }

  get icalUrl(): string {
    const p = new URLSearchParams();
    if (this.dateFrom) p.set('dateFrom', this.dateFrom);
    if (this.dateTo) p.set('dateTo', this.dateTo);
    const qs = p.toString() ? `?${p}` : '';
    return `${this.apiBase}/ical${qs}`;
  }

  exportPdf() {
    window.open(this.pdfUrl, '_blank');
  }

  exportIcal() {
    const a = document.createElement('a');
    a.href = this.icalUrl;
    a.download = 'planning.ics';
    a.click();
  }
}
