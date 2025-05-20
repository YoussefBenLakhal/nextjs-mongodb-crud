import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("[API] GET /api/attendance - Fetching attendance records");

    const user = await getSession();
    if (!user) {
      console.log("[API] No user in session");
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 });
    }

    console.log(`[API] User role: ${user.role}, ID: ${user.id}`);

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const subjectCode = searchParams.get("subjectCode");
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");

    console.log("[API] Query params:", { classId, subjectCode, date, studentId });

    const query = {};

    if (classId) {
      try {
        query.classId = new ObjectId(classId);
      } catch (err) {
        console.error("[API] Invalid classId format:", classId);
      }
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.date = { $gte: startDate, $lte: endDate };
    }

    if (studentId) {
      try {
        query.studentId = new ObjectId(studentId);
      } catch (err) {
        console.error("[API] Invalid studentId format:", studentId);
      }
    }

    if (user.role === "student" && !studentId) {
      try {
        query.studentId = new ObjectId(user.id);
      } catch (err) {
        console.error("[API] Invalid user.id format for student:", user.id);
      }
    }

    const { db } = await connectToDatabase();

    if (subjectCode) {
      const subject = await db.collection("subjects").findOne({ code: subjectCode });
      if (subject) {
        query.subjectId = subject._id;
      } else {
        console.log(`[API] Subject with code ${subjectCode} not found`);
      }
    }

    console.log("[API] Final query:", JSON.stringify(query));

    const attendance = await db.collection("attendance").find(query).sort({ date: -1 }).toArray();

    console.log(`[API] Found ${attendance.length} attendance records`);

    const serializedAttendance = attendance.map((record) => ({
      ...record,
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subjectId: record.subjectId.toString(),
      ...(record.classId && { classId: record.classId.toString() }),
      ...(record.createdBy && { createdBy: record.createdBy.toString() }),
    }));

    return NextResponse.json({ attendance: serializedAttendance });
  } catch (error) {
    console.error("[API] Attendance GET error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log("[API] POST /api/attendance - Creating attendance record");

    const user = await getSession();
    if (!user) {
      console.log("[API] No user in session");
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 });
    }

    if (user.role !== "teacher" && user.role !== "admin") {
      console.log(`[API] User role ${user.role} not authorized to create attendance`);
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can create attendance records" },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log("[API] Attendance data:", data);

    if (!data.studentId || !data.subjectId || !data.date || !data.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    try {
      data.studentId = new ObjectId(data.studentId);
      data.subjectId = new ObjectId(data.subjectId);
      if (data.classId) data.classId = new ObjectId(data.classId);
    } catch (err) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    data.createdAt = new Date();
    data.createdBy = new ObjectId(user.id);

    const result = await db.collection("attendance").insertOne(data);

    console.log(`[API] Created attendance record with ID: ${result.insertedId}`);

    return NextResponse.json({
      success: true,
      message: "Attendance record created",
      attendanceId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("[API] Attendance POST error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
