import { AttendanceRecord, AttendanceStats } from '../types';

export const calculateAttendanceStats = (
  records: AttendanceRecord[]
): AttendanceStats => {
  const totalDays = records.length;
  const presentDays = records.filter(r => r.status === 'present').length;
  const absentDays = records.filter(r => r.status === 'absent').length;
  const lateDays = records.filter(r => r.status === 'late').length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Calculate streak (consecutive days of presence)
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  for (const record of sortedRecords) {
    if (record.status === 'present') {
      streak++;
    } else {
      break;
    }
  }

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    attendanceRate,
    streak,
  };
};

export const calculateStreakBonus = (streak: number): number => {
  // For every 5 consecutive days of attendance, gain 1%
  return Math.floor(streak / 5);
};

export const getAttendanceRateWithBonus = (
  baseRate: number,
  streak: number
): number => {
  const bonus = calculateStreakBonus(streak);
  return Math.min(100, baseRate + bonus);
};
