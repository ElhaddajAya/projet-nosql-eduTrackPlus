import { User, Student, Teacher, Admin, Class, Session, AttendanceRecord, TeacherAttendance, Grade, AlertThreshold } from '../types';

// Users
export const admins: Admin[] = [
  {
    id: 'admin1',
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin',
  },
];

export const teachers: Teacher[] = [
  {
    id: 'teacher1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@school.com',
    password: 'teacher123',
    role: 'teacher',
    subjects: ['Mathématiques', 'Physique'],
    hireDate: '2020-09-01',
  },
  {
    id: 'teacher2',
    firstName: 'Pierre',
    lastName: 'Bernard',
    email: 'pierre.bernard@school.com',
    password: 'teacher123',
    role: 'teacher',
    subjects: ['Anglais'],
    hireDate: '2019-09-01',
  },
  {
    id: 'teacher3',
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@school.com',
    password: 'teacher123',
    role: 'teacher',
    subjects: ['Français', 'Histoire'],
    hireDate: '2021-09-01',
  },
  {
    id: 'teacher4',
    firstName: 'Sarah',
    lastName: 'Smith',
    email: 'sarah.smith@school.com',
    password: 'teacher123',
    role: 'teacher',
    subjects: ['Physique'],
    hireDate: '2020-09-01',
  },
  {
    id: 'teacher5',
    firstName: 'Emily',
    lastName: 'Williams',
    email: 'emily.williams@school.com',
    password: 'teacher123',
    role: 'teacher',
    subjects: ['Anglais'],
    hireDate: '2018-09-01',
  },
  {
    id: 'teacher6',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@school.com',
    password: 'teacher123',
    role: 'teacher',
    subjects: ['Mathématiques'],
    hireDate: '2017-09-01',
  },
];

export const students: Student[] = [
  {
    id: 'student1',
    firstName: 'Emma',
    lastName: 'Johnson',
    email: 'emma.j@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  {
    id: 'student2',
    firstName: 'Liam',
    lastName: 'Smith',
    email: 'liam.s@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  {
    id: 'student3',
    firstName: 'Olivia',
    lastName: 'Davis',
    email: 'olivia.d@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  {
    id: 'student4',
    firstName: 'Noah',
    lastName: 'Wilson',
    email: 'noah.w@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  {
    id: 'student5',
    firstName: 'Ava',
    lastName: 'Martinez',
    email: 'ava.m@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  {
    id: 'student6',
    firstName: 'William',
    lastName: 'Brown',
    email: 'william.b@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  {
    id: 'student7',
    firstName: 'Sophia',
    lastName: 'Garcia',
    email: 'sophia.g@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  {
    id: 'student8',
    firstName: 'James',
    lastName: 'Miller',
    email: 'james.m@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class1',
    enrollmentDate: '2023-09-01',
    level: 'Grade 10A',
    field: 'Sciences',
  },
  // Class 2 students
  {
    id: 'student9',
    firstName: 'Lucas',
    lastName: 'Anderson',
    email: 'lucas.a@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class2',
    enrollmentDate: '2023-09-01',
    level: 'Grade 11B',
    field: 'Lettres',
  },
  {
    id: 'student10',
    firstName: 'Mia',
    lastName: 'Taylor',
    email: 'mia.t@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class2',
    enrollmentDate: '2023-09-01',
    level: 'Grade 11B',
    field: 'Lettres',
  },
  // Class 3 students
  {
    id: 'student11',
    firstName: 'Ethan',
    lastName: 'Moore',
    email: 'ethan.m@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class3',
    enrollmentDate: '2023-09-01',
    level: 'Grade 9C',
    field: 'General',
  },
  {
    id: 'student12',
    firstName: 'Isabella',
    lastName: 'Lee',
    email: 'isabella.l@school.com',
    password: 'student123',
    role: 'student',
    classId: 'class3',
    enrollmentDate: '2023-09-01',
    level: 'Grade 9C',
    field: 'General',
  },
];

export const classes: Class[] = [
  {
    id: 'class1',
    name: 'Grade 10A - Mathématiques',
    level: 'Grade 10A',
    field: 'Sciences',
    studentIds: ['student1', 'student2', 'student3', 'student4', 'student5', 'student6', 'student7', 'student8'],
    teacherIds: ['teacher1', 'teacher2', 'teacher3'],
  },
  {
    id: 'class2',
    name: 'Grade 11B - Physique',
    level: 'Grade 11B',
    field: 'Lettres',
    studentIds: ['student9', 'student10'],
    teacherIds: ['teacher4', 'teacher5'],
  },
  {
    id: 'class3',
    name: 'Grade 9C - Anglais',
    level: 'Grade 9C',
    field: 'General',
    studentIds: ['student11', 'student12'],
    teacherIds: ['teacher5', 'teacher6'],
  },
];

export const sessions: Session[] = [
  // Monday
  {
    id: 'session1',
    classId: 'class1',
    subject: 'Mathématiques',
    teacherId: 'teacher1',
    day: 'monday',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Room 201',
    status: 'normal',
  },
  {
    id: 'session2',
    classId: 'class1',
    subject: 'Physique',
    teacherId: 'teacher1',
    day: 'monday',
    startTime: '10:15',
    endTime: '12:15',
    room: 'Room 201',
    status: 'normal',
  },
  {
    id: 'session3',
    classId: 'class1',
    subject: 'Français',
    teacherId: 'teacher3',
    day: 'monday',
    startTime: '14:00',
    endTime: '16:00',
    room: 'Room 201',
    status: 'cancelled',
  },
  // Tuesday
  {
    id: 'session4',
    classId: 'class1',
    subject: 'Anglais',
    teacherId: 'teacher2',
    day: 'tuesday',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Room 201',
    status: 'normal',
  },
  {
    id: 'session5',
    classId: 'class1',
    subject: 'Mathématiques',
    teacherId: 'teacher1',
    day: 'tuesday',
    startTime: '10:15',
    endTime: '12:15',
    room: 'Room 201',
    status: 'replaced',
    replacementTeacherId: 'teacher3',
  },
  // Wednesday
  {
    id: 'session6',
    classId: 'class1',
    subject: 'Histoire',
    teacherId: 'teacher3',
    day: 'wednesday',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Room 201',
    status: 'normal',
  },
  {
    id: 'session7',
    classId: 'class1',
    subject: 'Physique',
    teacherId: 'teacher1',
    day: 'wednesday',
    startTime: '10:15',
    endTime: '12:15',
    room: 'Lab 1',
    status: 'postponed',
    postponedTo: '2024-10-15',
  },
  // Thursday
  {
    id: 'session8',
    classId: 'class1',
    subject: 'Français',
    teacherId: 'teacher3',
    day: 'thursday',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Room 201',
    status: 'normal',
  },
  {
    id: 'session9',
    classId: 'class1',
    subject: 'Mathématiques',
    teacherId: 'teacher1',
    day: 'thursday',
    startTime: '10:15',
    endTime: '12:15',
    room: 'Room 201',
    status: 'normal',
  },
  // Friday
  {
    id: 'session10',
    classId: 'class1',
    subject: 'Anglais',
    teacherId: 'teacher2',
    day: 'friday',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Room 201',
    status: 'normal',
  },
  {
    id: 'session11',
    classId: 'class1',
    subject: 'Physique',
    teacherId: 'teacher1',
    day: 'friday',
    startTime: '10:15',
    endTime: '12:15',
    room: 'Lab 1',
    status: 'makeup',
    originalSessionId: 'session7',
  },
  // Class 2 sessions
  {
    id: 'session12',
    classId: 'class2',
    subject: 'Physique',
    teacherId: 'teacher4',
    day: 'tuesday',
    startTime: '10:15',
    endTime: '11:45',
    room: 'Lab 1',
    status: 'normal',
  },
  {
    id: 'session13',
    classId: 'class2',
    subject: 'Anglais',
    teacherId: 'teacher5',
    day: 'thursday',
    startTime: '08:00',
    endTime: '09:30',
    room: 'Room 105',
    status: 'normal',
  },
];

// Generate attendance records for the past 30 days
const generateAttendanceRecords = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    
    students.forEach((student) => {
      sessions
        .filter(s => s.classId === student.classId)
        .forEach((session) => {
          // Most students are present, some are absent or late
          const rand = Math.random();
          let status: 'present' | 'absent' | 'late' = 'present';
          
          if (student.id === 'student1') {
            // This student has good attendance for streak demo
            status = rand > 0.95 ? 'absent' : 'present';
          } else if (student.id === 'student2' || student.id === 'student4') {
            // These students have lower attendance
            status = rand > 0.85 ? (rand > 0.90 ? 'late' : 'absent') : 'present';
          } else {
            status = rand > 0.90 ? (rand > 0.95 ? 'late' : 'absent') : 'present';
          }
          
          records.push({
            id: `att_${student.id}_${session.id}_${dateStr}`,
            studentId: student.id,
            sessionId: session.id,
            date: dateStr,
            status,
          });
        });
    });
  }
  
  return records;
};

export const attendanceRecords: AttendanceRecord[] = generateAttendanceRecords();

export const teacherAttendances: TeacherAttendance[] = [
  {
    id: 'tatt1',
    teacherId: 'teacher1',
    date: '2024-11-15',
    reason: 'Conférence professionnelle',
  },
];

export const grades: Grade[] = [
  // Student 1
  { id: 'grade1', studentId: 'student1', subject: 'Mathématiques', semester: 1, score: 16, coefficient: 4 },
  { id: 'grade2', studentId: 'student1', subject: 'Physique', semester: 1, score: 15, coefficient: 3 },
  { id: 'grade3', studentId: 'student1', subject: 'Français', semester: 1, score: 14, coefficient: 3 },
  { id: 'grade4', studentId: 'student1', subject: 'Anglais', semester: 1, score: 17, coefficient: 2 },
  { id: 'grade5', studentId: 'student1', subject: 'Histoire', semester: 1, score: 13, coefficient: 2 },
  
  // Student 2
  { id: 'grade6', studentId: 'student2', subject: 'Mathématiques', semester: 1, score: 11, coefficient: 4 },
  { id: 'grade7', studentId: 'student2', subject: 'Physique', semester: 1, score: 10, coefficient: 3 },
  { id: 'grade8', studentId: 'student2', subject: 'Français', semester: 1, score: 12, coefficient: 3 },
  { id: 'grade9', studentId: 'student2', subject: 'Anglais', semester: 1, score: 9, coefficient: 2 },
  { id: 'grade10', studentId: 'student2', subject: 'Histoire', semester: 1, score: 11, coefficient: 2 },
  
  // More students
  { id: 'grade11', studentId: 'student3', subject: 'Mathématiques', semester: 1, score: 13, coefficient: 4 },
  { id: 'grade12', studentId: 'student3', subject: 'Physique', semester: 1, score: 12, coefficient: 3 },
  { id: 'grade13', studentId: 'student4', subject: 'Mathématiques', semester: 1, score: 9, coefficient: 4 },
  { id: 'grade14', studentId: 'student4', subject: 'Physique', semester: 1, score: 8, coefficient: 3 },
  { id: 'grade15', studentId: 'student5', subject: 'Mathématiques', semester: 1, score: 15, coefficient: 4 },
  { id: 'grade16', studentId: 'student6', subject: 'Mathématiques', semester: 1, score: 14, coefficient: 4 },
  { id: 'grade17', studentId: 'student7', subject: 'Mathématiques', semester: 1, score: 16, coefficient: 4 },
  { id: 'grade18', studentId: 'student8', subject: 'Mathématiques', semester: 1, score: 13, coefficient: 4 },
];

export const alertThresholds: AlertThreshold[] = [
  {
    id: 'threshold1',
    type: 'attendance',
    threshold: 80,
    message: 'Taux de présence inférieur à 80%',
  },
];

export const allUsers: User[] = [...admins, ...teachers, ...students];
