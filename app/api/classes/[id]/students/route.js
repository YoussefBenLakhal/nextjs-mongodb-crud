import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../../lib/server-auth"

// Get students for a class
export async function GET(request, { params }) {
  try {
    console.log("[API] GET /api/classes/[id]/students - Fetching students for class:", params.id)

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    const { id } = params
    const { db } = await connectToDatabase()

    // Verify class exists
    let classObjectId
    try {
      classObjectId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    const classExists = await db.collection("classes").findOne({ _id: classObjectId })
    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // If user is a teacher, verify they own this class
    if (userRole === "teacher" && classExists.teacherId.toString() !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only view students in your own classes" },
        { status: 401 },
      )
    }

    // Get students for this class
    const students = await db.collection("students").find({ classId: classObjectId }).sort({ name: 1 }).toArray()

    // Log the first student to see its structure
    if (students.length > 0) {
      console.log("[API] First student structure:", JSON.stringify(students[0]))
    } else {
      console.log("[API] No students found for class:", id)
    }

    // Convert ObjectIds to strings for JSON serialization
    const serializedStudents = students.map((student) => ({
      ...student,
      _id: student._id.toString(),
      classId: student.classId.toString(),
      ...(student.createdBy && { createdBy: student.createdBy.toString() }),
      ...(student.updatedBy && { updatedBy: student.updatedBy.toString() }),
    }))

    return NextResponse.json({ students: serializedStudents })
  } catch (error) {
    console.error("[API] Get students error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Add students to a class
export async function POST(request, { params }) {
  try {
    console.log("[API] POST /api/classes/[id]/students - Adding students to class:", params.id)

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can add students to classes" },
        { status: 401 },
      )
    }

    const { id } = params
    const body = await request.json()
    const { students } = body

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "Students array is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify class exists
    let classObjectId
    try {
      classObjectId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    const classExists = await db.collection("classes").findOne({ _id: classObjectId })
    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Verify teacher owns this class or is an admin
    if (userRole === "teacher" && classExists.teacherId.toString() !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only add students to your own classes" },
        { status: 401 },
      )
    }

    // Process each student
    const results = {
      success: [],
      failed: [],
    }

    for (const student of students) {
      try {
        // Check if student already exists
        const existingStudent = await db.collection("students").findOne({
          email: student.email,
        })

        if (existingStudent) {
          // Check if student is already in this class
          if (existingStudent.classId && existingStudent.classId.toString() === id) {
            results.failed.push({
              email: student.email,
              reason: "Student already in this class",
            })
            continue
          }

          // Update existing student's class
          await db.collection("students").updateOne(
            { _id: existingStudent._id },
            {
              $set: {
                classId: classObjectId,
                updatedAt: new Date(),
                updatedBy: new ObjectId(userId),
              },
            },
          )

          results.success.push({
            _id: existingStudent._id.toString(),
            name: existingStudent.name,
            email: existingStudent.email,
            status: "updated",
          })
        } else {
          // Create new student
          const newStudent = {
            firstName: student.firstName || student.name?.split(" ")[0] || "",
            lastName: student.lastName || student.name?.split(" ").slice(1).join(" ") || "",
            name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
            email: student.email,
            classId: classObjectId,
            createdAt: new Date(),
            createdBy: new ObjectId(userId),
          }

          const result = await db.collection("students").insertOne(newStudent)

          results.success.push({
            _id: result.insertedId.toString(),
            name: newStudent.name,
            firstName: newStudent.firstName,
            lastName: newStudent.lastName,
            email: student.email,
            status: "created",
          })
        }
      } catch (error) {
        console.error("[API] Error processing student:", error)
        results.failed.push({
          email: student.email,
          reason: error.message,
        })
      }
    }

    // Update class with student count
    const studentCount = await db.collection("students").countDocuments({ classId: classObjectId })
    await db.collection("classes").updateOne(
      { _id: classObjectId },
      {
        $set: {
          studentCount: studentCount,
          updatedAt: new Date(),
          updatedBy: new ObjectId(userId),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: `Added ${results.success.length} students to class, ${results.failed.length} failed`,
      results,
    })
  } catch (error) {
    console.error("[API] Add students error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Remove a student from a class
export async function DELETE(request, { params }) {
  try {
    console.log("[API] DELETE /api/classes/[id]/students - Removing student from class:", params.id)

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can remove students from classes" },
        { status: 401 },
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify class exists
    let classObjectId
    try {
      classObjectId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    const classExists = await db.collection("classes").findOne({ _id: classObjectId })
    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Verify teacher owns this class or is an admin
    if (userRole === "teacher" && classExists.teacherId.toString() !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only remove students from your own classes" },
        { status: 401 },
      )
    }

    // Verify student exists
    let studentObjectId
    try {
      studentObjectId = new ObjectId(studentId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 })
    }

    const student = await db.collection("students").findOne({ _id: studentObjectId })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify student is in this class
    if (!student.classId || student.classId.toString() !== id) {
      return NextResponse.json({ error: "Student is not in this class" }, { status: 400 })
    }

    // Check if student has attendance or grades
    const attendanceCount = await db.collection("attendance").countDocuments({ studentId: studentObjectId })
    const gradesCount = await db.collection("grades").countDocuments({ studentId: studentObjectId })

    // If force parameter is not provided and student has records, return error
    const forceRemove = searchParams.get("force") === "true"
    if ((attendanceCount > 0 || gradesCount > 0) && !forceRemove) {
      return NextResponse.json(
        {
          error: "Cannot remove student with attendance or grade records",
          attendanceCount,
          gradesCount,
          requiresForce: true,
        },
        { status: 400 },
      )
    }

    // If force remove, delete attendance and grades
    if (forceRemove) {
      if (attendanceCount > 0) {
        await db.collection("attendance").deleteMany({ studentId: studentObjectId })
      }
      if (gradesCount > 0) {
        await db.collection("grades").deleteMany({ studentId: studentObjectId })
      }
    }

    // Remove student from class (set classId to null)
    await db.collection("students").updateOne(
      { _id: studentObjectId },
      {
        $unset: { classId: "" },
        $set: {
          updatedAt: new Date(),
          updatedBy: new ObjectId(userId),
        },
      },
    )

    // Update class with student count
    const studentCount = await db.collection("students").countDocuments({ classId: classObjectId })
    await db.collection("classes").updateOne(
      { _id: classObjectId },
      {
        $set: {
          studentCount: studentCount,
          updatedAt: new Date(),
          updatedBy: new ObjectId(userId),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: forceRemove
        ? `Removed student and deleted ${attendanceCount} attendance records and ${gradesCount} grades`
        : "Removed student from class",
    })
  } catch (error) {
    console.error("[API] Remove student error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
