import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"
import bcrypt from "bcryptjs"

// Create a new student
export async function POST(request) {
  try {
    console.log("[API] POST /api/students - Creating new student")

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
        { error: "Unauthorized - Only teachers and admins can create students" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, classId, createAccount, password } = body

    if ((!firstName && !lastName) || !email) {
      return NextResponse.json({ error: "Name (first or last) and email are required" }, { status: 400 })
    }

    if (createAccount && !password) {
      return NextResponse.json({ error: "Password is required when creating an account" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if student with same email already exists
    const existingStudent = await db.collection("students").findOne({ email })

    if (existingStudent) {
      return NextResponse.json({ error: "A student with this email already exists" }, { status: 400 })
    }

    // Verify class exists if classId is provided
    let classObjectId = null
    if (classId) {
      try {
        classObjectId = new ObjectId(classId)
        const classExists = await db.collection("classes").findOne({ _id: classObjectId })
        if (!classExists) {
          return NextResponse.json({ error: "Class not found" }, { status: 404 })
        }

        // If user is a teacher, verify they own this class
        if (userRole === "teacher" && classExists.teacherId.toString() !== userId) {
          return NextResponse.json(
            { error: "Unauthorized - You can only add students to your own classes" },
            { status: 401 },
          )
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
      }
    }

    // Create user account if requested
    let userAccount = null
    if (createAccount) {
      // Check if user with same email already exists
      const existingUser = await db.collection("users").findOne({ email })

      if (existingUser) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const newUser = {
        email,
        password: hashedPassword,
        role: "student",
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        createdAt: new Date(),
        createdBy: new ObjectId(userId),
        updatedAt: new Date(),
        updatedBy: new ObjectId(userId),
      }

      const userResult = await db.collection("users").insertOne(newUser)
      userAccount = {
        _id: userResult.insertedId,
        email,
        role: "student",
      }
    }

    // Create student
    const name = `${firstName} ${lastName}`.trim()
    const newStudent = {
      firstName,
      lastName,
      name,
      email,
      ...(classObjectId && { classId: classObjectId }),
      ...(userAccount && { userId: userAccount._id }),
      createdAt: new Date(),
      createdBy: new ObjectId(userId),
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    }

    const result = await db.collection("students").insertOne(newStudent)

    // Update class with student count if classId is provided
    if (classObjectId) {
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
    }

    return NextResponse.json({
      success: true,
      message: "Student created successfully",
      student: {
        _id: result.insertedId.toString(),
        firstName,
        lastName,
        name,
        email,
        ...(classObjectId && { classId: classObjectId.toString() }),
        ...(userAccount && { userId: userAccount._id.toString() }),
      },
      userAccount: userAccount
        ? {
            _id: userAccount._id.toString(),
            email,
            role: "student",
          }
        : null,
    })
  } catch (error) {
    console.error("[API] Create student error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Get all students
export async function GET(request) {
  try {
    console.log("[API] GET /api/students - Fetching students")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    console.log("[API] User from session:", { id: user.id, role: user.role })

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      console.log("[API] Unauthorized role:", userRole)
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can view all students" },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    console.log("[API] Query parameters:", { classId, search, limit, page })

    try {
      const { db } = await connectToDatabase()
      console.log("[API] Database connection established")

      const query = {}

      // Filter by class if provided
      if (classId) {
        try {
          const classObjectId = new ObjectId(classId)
          query.classId = classObjectId

          // If user is a teacher, verify they own this class
          if (userRole === "teacher") {
            console.log("[API] Verifying teacher owns class:", classId)
            const classExists = await db.collection("classes").findOne({ _id: classObjectId })

            if (!classExists) {
              console.log("[API] Class not found:", classId)
              return NextResponse.json({ error: "Class not found" }, { status: 404 })
            }

            if (classExists.teacherId.toString() !== userId) {
              console.log(
                "[API] Teacher does not own class. Teacher ID:",
                userId,
                "Class teacher ID:",
                classExists.teacherId.toString(),
              )
              return NextResponse.json(
                { error: "Unauthorized - You can only view students in your own classes" },
                { status: 401 },
              )
            }
          }
        } catch (error) {
          console.error("[API] Invalid class ID format:", error)
          return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
        }
      } else if (userRole === "teacher") {
        // If no class filter and user is a teacher, only show students in their classes
        console.log("[API] Finding classes for teacher:", userId)
        const teacherClasses = await db
          .collection("classes")
          .find({ teacherId: new ObjectId(userId) })
          .project({ _id: 1 })
          .toArray()

        console.log("[API] Found", teacherClasses.length, "classes for teacher")

        const classIds = teacherClasses.map((cls) => cls._id)
        if (classIds.length > 0) {
          query.classId = { $in: classIds }
        } else {
          // If teacher has no classes, return empty array
          console.log("[API] Teacher has no classes, returning empty result")
          return NextResponse.json({ students: [], total: 0, page, limit })
        }
      }

      // Add search filter if provided
      if (search) {
        const searchRegex = new RegExp(search, "i")
        query.$or = [
          { name: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ]
      }

      console.log("[API] Final query:", JSON.stringify(query))

      // Get total count for pagination
      const total = await db.collection("students").countDocuments(query)
      console.log("[API] Total students matching query:", total)

      // Get students
      const students = await db.collection("students").find(query).sort({ name: 1 }).skip(skip).limit(limit).toArray()

      console.log("[API] Retrieved", students.length, "students")

      // Log the first student to see its structure
      if (students.length > 0) {
        console.log("[API] First student structure:", JSON.stringify(students[0]))
      } else {
        console.log("[API] No students found for query:", JSON.stringify(query))
      }

      // Convert ObjectIds to strings for JSON serialization
      const serializedStudents = students.map((student) => ({
        ...student,
        _id: student._id.toString(),
        ...(student.classId && { classId: student.classId.toString() }),
        ...(student.userId && { userId: student.userId.toString() }),
        ...(student.createdBy && { createdBy: student.createdBy.toString() }),
        ...(student.updatedBy && { updatedBy: student.updatedBy.toString() }),
      }))

      return NextResponse.json({ students: serializedStudents, total, page, limit })
    } catch (dbError) {
      console.error("[API] Database error:", dbError)
      return NextResponse.json({ error: "Database error", details: dbError.message }, { status: 500 })
    }
  } catch (error) {
    console.error("[API] Get students error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
