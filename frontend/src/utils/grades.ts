import { Grade } from '../types';

export interface GradeStats {
  average: number;
  status: 'Validé' | 'Rattrapage' | 'Non validé';
}

export const calculateGradeAverage = (grades: Grade[]): number => {
  if (grades.length === 0) return 0;

  const totalPoints = grades.reduce(
    (sum, grade) => sum + grade.score * grade.coefficient,
    0
  );
  const totalCoefficients = grades.reduce(
    (sum, grade) => sum + grade.coefficient,
    0
  );

  return totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
};

export const getGradeStatus = (average: number): 'Validé' | 'Rattrapage' | 'Non validé' => {
  if (average >= 10) return 'Validé';
  if (average >= 8) return 'Rattrapage';
  return 'Non validé';
};

export const getGradesBySubject = (grades: Grade[]): Map<string, Grade[]> => {
  const bySubject = new Map<string, Grade[]>();
  
  grades.forEach(grade => {
    const existing = bySubject.get(grade.subject) || [];
    bySubject.set(grade.subject, [...existing, grade]);
  });
  
  return bySubject;
};

export const getGradesBySemester = (grades: Grade[]): Map<number, Grade[]> => {
  const bySemester = new Map<number, Grade[]>();
  
  grades.forEach(grade => {
    const existing = bySemester.get(grade.semester) || [];
    bySemester.set(grade.semester, [...existing, grade]);
  });
  
  return bySemester;
};
