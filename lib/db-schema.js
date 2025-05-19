// This file outlines the database schema structure (not actual MongoDB schema)

// Users Collection
const userSchema = {
    _id: "ObjectId",
    email: "String", // unique
    password: "String", // hashed
    role: "String", // "teacher" or "student"
    name: "String",
    createdAt: "Date",
    updatedAt: "Date",
  }
  
  // Classes/Courses Collection
  const classSchema = {
    _id: "ObjectId",
    name: "String", // e.g., "Math 101", "History 202"
    description: "String",
    teacherId: "ObjectId", // reference to teacher user
    academicYear: "String", // e.g., "2024-2025"
    students: ["ObjectId"], // array of student user IDs enrolled in this class
    createdAt: "Date",
    updatedAt: "Date",
  }
  
  // Subjects (Matières) Collection
  const subjectSchema = {
    _id: "ObjectId",
    name: "String", // e.g., "Mathematics", "History"
    code: "String", // e.g., "MATH101"
    description: "String",
    classId: "ObjectId", // reference to class
    teacherId: "ObjectId", // reference to teacher user
    createdAt: "Date",
    updatedAt: "Date",
  }
  
  // Grades Collection
  const gradeSchema = {
    _id: "ObjectId",
    studentId: "ObjectId", // reference to student user
    subjectId: "ObjectId", // reference to subject
    teacherId: "ObjectId", // reference to teacher user
    classId: "ObjectId", // reference to class
    title: "String", // e.g., "Midterm Exam", "Final Project"
    score: "Number", // e.g., 85
    maxScore: "Number", // e.g., 100
    weight: "Number", // e.g., 0.3 for 30% of final grade
    comment: "String",
    date: "Date",
    createdAt: "Date",
    updatedAt: "Date",
  }
  
  // Attendance Collection
  const attendanceSchema = {
    _id: "ObjectId",
    date: "Date",
    subjectId: "ObjectId", // reference to subject
    classId: "ObjectId", // reference to class
    teacherId: "ObjectId", // reference to teacher user
    records: [
      {
        studentId: "ObjectId", // reference to student user
        status: "String", // "present", "absent", "late", "excused"
        comment: "String",
      },
    ],
    createdAt: "Date",
    updatedAt: "Date",
  }
  
  // Student Profile Collection (Extended user info for students)
  const studentProfileSchema = {
    _id: "ObjectId",
    userId: "ObjectId", // reference to user
    firstName: "String",
    lastName: "String",
    dateOfBirth: "Date",
    address: "String",
    phoneNumber: "String",
    parentName: "String",
    parentContact: "String",
    enrolledClasses: ["ObjectId"], // array of class IDs
    createdAt: "Date",
    updatedAt: "Date",
  }
  
  // Teacher Profile Collection (Extended user info for teachers)
  const teacherProfileSchema = {
    _id: "ObjectId",
    userId: "ObjectId", // reference to user
    firstName: "String",
    lastName: "String",
    specialization: "String",
    qualification: "String",
    phoneNumber: "String",
    assignedClasses: ["ObjectId"], // array of class IDs
    createdAt: "Date",
    updatedAt: "Date",
  }
  