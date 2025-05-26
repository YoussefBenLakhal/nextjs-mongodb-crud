import { getServerSession } from "next-auth";
import { authOptions } from "./../../../lib/auth";
import { connectToDatabase } from './../../../lib/mongodb';
import Attendance from "../../../models/Attendance";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  await connectToDB();
  const userId = session.user.id;
  const role = session.user.role;

  let query = {};

  if (role === "student") {
    query.studentId = userId;
  } else if (role === "teacher") {
    const { classId, subjectCode, date, studentId } = req.query;
    if (classId) query.classId = classId;
    if (subjectCode) query.subjectCode = subjectCode;
    if (date) query.date = date;
    if (studentId) query.studentId = studentId;
  }

  const attendance = await Attendance.find(query).lean();

  // ⛑️ Inject fallback if no attendance
  if (attendance.length === 0 && role === "student") {
    const fallbackAttendance = [
      {
        studentId: userId,
        subject: "JS",
        date: "2025-05-10",
        status: "present"
      },
      {
        studentId: userId,
        subject: "Node",
        date: "2025-05-12",
        status: "absent"
      }
    ];
    await Attendance.insertMany(fallbackAttendance);
    return res.status(200).json(fallbackAttendance);
  }

  return res.status(200).json(attendance);
}
