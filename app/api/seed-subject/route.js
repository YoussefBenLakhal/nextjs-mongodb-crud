import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"

export async function GET(request) {
  try {
    console.log("[API] GET /api/seed-subjects - Seeding subjects")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No user in session",
        },
        { status: 401 },
      )
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Only teachers and admins can seed subjects",
        },
        { status: 401 },
      )
    }

    // Connect to database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected || !db) {
      console.log(`[API] Database connection failed: ${error}`)
      return NextResponse.json({
        success: false,
        error: `Database connection failed: ${error}`,
      })
    }

    // Create default class if it doesn't exist
    let defaultClassId
    const defaultClass = await db.collection("classes").findOne({ name: "Default Class" })

    if (!defaultClass) {
      const result = await db.collection("classes").insertOne({
        name: "Default Class",
        grade: "10",
        section: "A",
        academicYear: "2023-2024",
        createdAt: new Date(),
        createdBy: new ObjectId(userId),
      })
      defaultClassId = result.insertedId
    } else {
      defaultClassId = defaultClass._id
    }

    // Sample subjects to seed
    const sampleSubjects = [
      {
        name: "Mathematics",
        code: "MATH101",
        description: "Basic mathematics including algebra, geometry, and trigonometry",
        classId: defaultClassId,
        teacherId: new ObjectId(userId),
        createdAt: new Date(),
        createdBy: new ObjectId(userId),
        generatedId: "Mathematics|MATH101",
      },
      {
        name: "Science",
        code: "SCI101",
        description: "Introduction to scientific principles and methods",
        classId: defaultClassId,
        teacherId: new ObjectId(userId),
        createdAt: new Date(),
        createdBy: new ObjectId(userId),
        generatedId: "Science|SCI101",
      },
      {
        name: "English",
        code: "ENG101",
        description: "English language and literature",
        classId: defaultClassId,
        teacherId: new ObjectId(userId),
        createdAt: new Date(),
        createdBy: new ObjectId(userId),
        generatedId: "English|ENG101",
      },
      {
        name: "History",
        code: "HIST101",
        description: "World history and historical analysis",
        classId: defaultClassId,
        teacherId: new ObjectId(userId),
        createdAt: new Date(),
        createdBy: new ObjectId(userId),
        generatedId: "History|HIST101",
      },
      {
        name: "Physical Education",
        code: "PE101",
        description: "Physical fitness and sports",
        classId: defaultClassId,
        teacherId: new ObjectId(userId),
        createdAt: new Date(),
        createdBy: new ObjectId(userId),
        generatedId: "Physical Education|PE101",
      },
    ]

    // Insert subjects
    const result = await db.collection("subjects").insertMany(sampleSubjects)

    // Convert ObjectIds to strings for JSON serialization
    const serializedSubjects = sampleSubjects.map((subject, index) => ({
      ...subject,
      _id: result.insertedIds[index].toString(),
      classId: subject.classId.toString(),
      teacherId: subject.teacherId.toString(),
      createdBy: subject.createdBy.toString(),
    }))

    return NextResponse.json({
      success: true,
      message: "Subjects seeded successfully",
      subjects: serializedSubjects,
    })
  } catch (error) {
    console.error("[API] Seed subjects error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error: " + error.message,
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
