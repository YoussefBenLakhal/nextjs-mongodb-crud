import { ObjectId } from 'mongodb';

export const transformUser = (user) => {
  if (!user) return null;
  
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString()
  };
};

export const transformGrade = (grade) => ({
  id: grade._id.toString(),
  studentId: grade.studentId.toString(),
  teacherId: grade.teacherId.toString(),
  course: grade.course,
  grade: grade.grade,
  date: grade.date.toISOString()
});

export const transformAbsence = (absence) => ({
  id: absence._id.toString(),
  studentId: absence.studentId.toString(),
  teacherId: absence.teacherId.toString(),
  course: absence.course,
  date: absence.date.toISOString(),
  status: absence.status
});

export const validateObjectId = (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }
  return new ObjectId(id);
};