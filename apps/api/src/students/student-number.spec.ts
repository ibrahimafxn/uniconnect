import { buildStudentNumber, normalizeStudentNumber } from './student-number';
import { StudentGender } from './student-profile.schema';

describe('student-number', () => {
  it('buildStudentNumber uses male gender digit', () => {
    const res = buildStudentNumber({
      gender: StudentGender.Male,
      birthDate: new Date('2004-03-15'),
      firstName: 'John',
      lastName: 'Doe',
      inscriptionYear: 2026,
    });
    expect(res).toBe('ML103DJ2026');
  });

  it('buildStudentNumber uses female gender digit and fallback initials', () => {
    const res = buildStudentNumber({
      gender: StudentGender.Female,
      birthDate: new Date('2004-12-01'),
      firstName: '',
      lastName: '',
      inscriptionYear: 2026,
    });
    expect(res).toBe('ML012XX2026');
  });

  it('normalizeStudentNumber trims and uppercases', () => {
    expect(normalizeStudentNumber(' ml103dj2026 ')).toBe('ML103DJ2026');
  });
});
