import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NotesApi, Evaluation, Subject} from '../../../core/api/notes.api';
import {AcademicApi} from '../../../core/api/academic.api';
import {AttendanceApi} from '../../../core/api/attendance.api';
import {forkJoin, of} from 'rxjs';
import {switchMap, map} from 'rxjs/operators';

type SubjectStat = {
  subject: Subject;
  evaluations: Evaluation[];
  count: number;
  gradedCount: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  distribution: number[]; // buckets: 0-4, 5-9, 10-12, 13-15, 16-18, 19-20
};

type GroupStat = {
  groupId: string;
  groupName: string;
  subjectStats: SubjectStat[];
  attendanceSummary: any[];
  presentRate: number | null;
};

@Component({
  selector: 'app-teacher-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-stats.component.html',
  styleUrls: ['./teacher-stats.component.scss'],
})
export class TeacherStatsComponent {
  private readonly notes = inject(NotesApi);
  private readonly academic = inject(AcademicApi);
  private readonly attendance = inject(AttendanceApi);

  selectedGroupId: string | null = null;
  groupStats: GroupStat | null = null;
  loading = false;

  groups$ = this.academic.listGroups();

  selectGroup(groupId: string, groupName: string) {
    this.selectedGroupId = groupId;
    this.loading = true;
    this.groupStats = null;

    forkJoin({
      subjects: this.notes.listSubjects(),
      evaluations: this.notes.listEvaluations(groupId),
      students: this.notes.listGroupStudents(groupId),
      attendance: this.attendance.getGroupSummary(groupId),
    }).pipe(
      switchMap(({subjects, evaluations, students, attendance}) => {
        if (!evaluations.length) {
          return of({subjects, evaluations, students, attendance, allGrades: []});
        }
        const gradeRequests = evaluations.map((e) =>
          this.notes.listGrades(e._id).pipe(map((grades) => ({evalId: e._id, grades}))),
        );
        return forkJoin(gradeRequests).pipe(
          map((allGrades) => ({subjects, evaluations, students, attendance, allGrades})),
        );
      }),
    ).subscribe({
      next: ({subjects, evaluations, students, attendance, allGrades}) => {
        const subjectStats: SubjectStat[] = subjects.map((subject) => {
          const subjectEvals = evaluations.filter((e) => e.subjectId === subject._id);
          const scores: number[] = [];

          for (const ev of subjectEvals) {
            const gradeData = allGrades.find((g: any) => g.evalId === ev._id);
            if (gradeData) {
              for (const g of gradeData.grades) {
                const normalized = (g.score / (ev.maxScore || 20)) * 20;
                scores.push(normalized);
              }
            }
          }

          const distribution = [0, 0, 0, 0, 0, 0];
          for (const s of scores) {
            if (s < 5) distribution[0]++;
            else if (s < 10) distribution[1]++;
            else if (s < 13) distribution[2]++;
            else if (s < 16) distribution[3]++;
            else if (s < 19) distribution[4]++;
            else distribution[5]++;
          }

          return {
            subject,
            evaluations: subjectEvals,
            count: subjectEvals.length,
            gradedCount: scores.length,
            avg: scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null,
            min: scores.length ? +Math.min(...scores).toFixed(2) : null,
            max: scores.length ? +Math.max(...scores).toFixed(2) : null,
            distribution,
          };
        });

        const presentRates = attendance
          .filter((a: any) => a.rate !== null)
          .map((a: any) => a.rate as number);
        const presentRate = presentRates.length
          ? Math.round(presentRates.reduce((a: number, b: number) => a + b, 0) / presentRates.length)
          : null;

        this.groupStats = {
          groupId,
          groupName,
          subjectStats: subjectStats.filter((s) => s.count > 0),
          attendanceSummary: attendance,
          presentRate,
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  barWidth(value: number, max: number): string {
    if (!max) return '0%';
    return Math.round((value / max) * 100) + '%';
  }

  barMax(distribution: number[]): number {
    return Math.max(...distribution, 1);
  }

  getScoreColor(avg: number | null): string {
    if (avg === null) return 'var(--muted)';
    if (avg >= 14) return '#15803d';
    if (avg >= 10) return '#b45309';
    return '#b91c1c';
  }
}
