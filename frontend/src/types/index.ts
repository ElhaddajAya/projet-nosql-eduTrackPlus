// User Types
export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Student extends User {
  role: 'student';
  classId: string;
  enrollmentDate: string;
  level: string;
  field: string;
}

export interface Teacher extends User {
  role: 'teacher';
  subjects: string[];
  hireDate: string;
}

export interface Admin extends User {
  role: 'admin';
}

// Class Types
export interface Class {
  id: string;
  name: string;
  level: string;
  field: string;
  studentIds: string[];
  teacherIds: string[];
}

// Schedule Types
export type SessionStatus = 'normal' | 'cancelled' | 'postponed' | 'makeup' | 'replaced';

export interface Session {
  id: string;
  classId: string;
  subject: string;
  teacherId: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  startTime: string;
  endTime: string;
  room: string;
  status: SessionStatus;
  replacementTeacherId?: string;
  postponedTo?: string;
  originalSessionId?: string;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string;
  reason?: string;
}

// Grade Types
export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  semester: number;
  score: number;
  coefficient: number;
}

// Alert Configuration
export interface AlertThreshold {
  id: string;
  type: 'attendance';
  threshold: number;
  message: string;
}

// Statistics Types
export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  streak: number;
}
