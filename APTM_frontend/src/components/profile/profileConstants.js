import {
  FaChartBar, FaGraduationCap, FaRegUserCircle, FaCode, FaChartPie
} from 'react-icons/fa';

export const experienceLevels = {
  beginner: { label: 'Beginner', color: '#10b981', level: 1 },
  intermediate: { label: 'Intermediate', color: '#3b82f6', level: 2 },
  advanced: { label: 'Advanced', color: '#8b5cf6', level: 3 },
  expert: { label: 'Expert', color: '#f59e0b', level: 4 },
  master: { label: 'Master', color: '#ef4444', level: 5 }
};

export const badgeConfig = {
  trader: { label: 'Trader', color: '#3b82f6', Icon: FaChartBar },
  mentor: { label: 'Mentor', color: '#f59e0b', Icon: FaGraduationCap },
  student: { label: 'Student', color: '#10b981', Icon: FaRegUserCircle },
  developer: { label: 'Developer', color: '#8b5cf6', Icon: FaCode },
  analyst: { label: 'Analyst', color: '#ef4444', Icon: FaChartPie }
};