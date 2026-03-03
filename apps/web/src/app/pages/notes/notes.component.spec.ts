import {TestBed} from '@angular/core/testing';
import {NotesComponent} from './notes.component';
import {NotesApi} from '../../core/api/notes.api';
import {AcademicApi} from '../../core/api/academic.api';
import {AuthService} from '../../core/auth.service';
import {of} from 'rxjs';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

describe('NotesComponent', () => {
  const notesMock = () => ({
    listSubjects: jasmine.createSpy('listSubjects').and.returnValue(of([])),
    listEvaluations: jasmine.createSpy('listEvaluations').and.returnValue(of([])),
    listGroupStudents: jasmine.createSpy('listGroupStudents').and.returnValue(of([])),
    listGrades: jasmine.createSpy('listGrades').and.returnValue(of([])),
    createSubject: jasmine.createSpy('createSubject').and.returnValue(of({})),
    createEvaluation: jasmine.createSpy('createEvaluation').and.returnValue(of({})),
    upsertGrades: jasmine.createSpy('upsertGrades').and.returnValue(of({ success: true })),
    studentSummary: jasmine.createSpy('studentSummary').and.returnValue(of({})),
    mySummary: jasmine.createSpy('mySummary').and.returnValue(of(null)),
  });

  const academicMock = () => ({
    listLevels: jasmine.createSpy('listLevels').and.returnValue(of({ items: [] })),
    listGroups: jasmine.createSpy('listGroups').and.returnValue(of({ items: [] })),
  });

  const authMock = (role: string) => ({
    getUserRole: jasmine.createSpy('getUserRole').and.returnValue(role),
  });

  function setup(role = 'admin') {
    const notes = notesMock();
    const academic = academicMock();
    const auth = authMock(role);
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule],
      providers: [
        { provide: NotesApi, useValue: notes },
        { provide: AcademicApi, useValue: academic },
        { provide: AuthService, useValue: auth },
      ],
    });
    const comp = TestBed.runInInjectionContext(() => new NotesComponent());
    return { comp, notes };
  }

  it('creates subject', () => {
    const { comp, notes } = setup('admin');
    comp.subjectForm.setValue({ name: 'Math', code: 'M1', coefficient: 2, levelId: 'l1' });
    comp.createSubject();
    expect(notes.createSubject).toHaveBeenCalled();
  });

  it('creates evaluation', () => {
    const { comp, notes } = setup('teacher');
    comp.evaluationForm.setValue({
      title: 'DS1',
      date: '2026-06-12',
      subjectId: 's1',
      groupId: 'g1',
      maxScore: 20,
    });
    comp.createEvaluation();
    expect(notes.createEvaluation).toHaveBeenCalled();
  });

  it('saveGrades calls api', () => {
    const { comp, notes } = setup('teacher');
    comp.gradeForm.setValue({ groupId: 'g1', evaluationId: 'e1' });
    comp.saveGrades([{ student: { _id: 'st1' }, score: 10 }]);
    expect(notes.upsertGrades).toHaveBeenCalledWith('e1', [{ studentId: 'st1', score: 10 }]);
  });

  it('loadSummary calls api', () => {
    const { comp, notes } = setup('admin');
    comp.loadSummary('st1');
    expect(notes.studentSummary).toHaveBeenCalledWith('st1');
  });
});
