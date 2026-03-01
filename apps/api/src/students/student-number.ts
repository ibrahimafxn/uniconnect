import { StudentGender } from './student-profile.schema';

export const STUDENT_NUMBER_REGEX =
  /^ML[01](0[1-9]|1[0-2])[A-Z]{2}\d{4}\d*$/;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();

const genderDigit = (gender: StudentGender) =>
  gender === StudentGender.Male ? '1' : '0';

export const buildStudentNumber = (params: {
  gender: StudentGender;
  birthDate: Date;
  firstName: string;
  lastName: string;
  inscriptionYear?: number;
}) => {
  const month = String(params.birthDate.getMonth() + 1).padStart(2, '0');
  const lastInitial = normalize(params.lastName).charAt(0) || 'X';
  const firstInitial = normalize(params.firstName).charAt(0) || 'X';
  const year = params.inscriptionYear ?? new Date().getFullYear();
  return `ML${genderDigit(params.gender)}${month}${lastInitial}${firstInitial}${year}`;
};

export const normalizeStudentNumber = (value: string) =>
  value.trim().toUpperCase();
