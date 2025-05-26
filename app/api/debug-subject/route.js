import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    // Get user from session
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // If an ID is provided, fetch that specific subject
    if (id) {
      console.log(`[API] Debug-subjects: Fetching subject with ID: ${id}`)

      // Try multiple query approaches
      let subject = null

      // Try with ObjectId
      try {
        const objectId = new ObjectId(id)
        subject = await db.collection("subjects").findOne({ _id: objectId })
        if (subject) {
          console.log(`[API] Debug-subjects: Found subject with ObjectId`)
        }
      } catch (error) {
        console.log(`[API] Debug-subjects: ID ${id} is not a valid ObjectId or subject not found with ObjectId`)
      }

      // Try with string ID
      if (!subject) {
        subject = await db.collection("subjects").findOne({ _id: id })
        if (subject) {
          console.log(`[API] Debug-subjects: Found subject with string ID`)
        }
      }

      // Try with additional fields
      if (!subject) {
        subject = await db.collection("subjects").findOne({
          $or: [{ generatedId: id }, { uniqueIdentifier: id }],
        })
        if (subject) {
          console.log(`[API] Debug-subjects: Found subject with additional fields`)
        }
      }

      if (!subject) {
        // Check if the subject exists in the frontend list but not in the database
        console.log(`[API] Debug-subjects: Subject not found in database, checking collection info`)

        // Get collection stats for debugging
        const stats = await db.command({ collStats: "subjects" })

        return NextResponse.json(
          {
            error: "Subject not found",
            id: id,
            collectionInfo: {
              count: stats.count,
              size: stats.size,
              avgObjSize: stats.avgObjSize,
            },
            message: "The subject could not be found in the database. It may be a ghost entry in the frontend cache.",
          },
          { status: 404 },
        )
      }

      // Convert ObjectIds to strings for JSON serialization
      const serializedSubject = {
        ...subject,
        _id: subject._id.toString ? subject._id.toString() : subject._id,
        classId: subject.classId?.toString ? subject.classId.toString() : subject.classId,
        ...(subject.teacherId && {
          teacherId: subject.teacherId.toString ? subject.teacherId.toString() : subject.teacherId,
        }),
        ...(subject.createdBy && {
          createdBy: subject.createdBy.toString ? subject.createdBy.toString() : subject.createdBy,
        }),
      }

      return NextResponse.json({ subject: serializedSubject })
    }

    // If no ID is provided, fetch all subjects
    else {
      console.log(`[API] Debug-subjects: Fetching all subjects`)
      const subjects = await db.collection("subjects").find({}).toArray()

      // Convert ObjectIds to strings for JSON serialization
      const serializedSubjects = subjects.map((subject) => ({
        ...subject,
        _id: subject._id.toString ? subject._id.toString() : subject._id,
        classId: subject.classId?.toString ? subject.classId.toString() : subject.classId,
        ...(subject.teacherId && {
          teacherId: subject.teacherId.toString ? subject.teacherId.toString() : subject.teacherId,
        }),
        ...(subject.createdBy && {
          createdBy: subject.createdBy.toString ? subject.createdBy.toString() : subject.createdBy,
        }),
      }))

      return NextResponse.json({ subjects: serializedSubjects })
    }
  } catch (error) {
    console.error(`[API] Debug-subjects error:`, error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")
    const force = searchParams.get("force") === "true"

    if (!id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    // Get user from session
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    if (action === "delete") {
      console.log(`[API] Debug-subjects: Direct delete for subject ID: ${id}, force: ${force}`)

      // Try multiple delete approaches
      let deleteResult = null
      let attendanceDeleted = 0
      let assessmentsDeleted = 0

      // If force delete, remove related records first
      if (force) {
        // Delete attendance records
        const attendanceResult = await db.collection("attendance").deleteMany({
          $or: [
            { subjectId: id },
            { subject: id },
            { subjectCode: { $exists: true } }, // This is a fallback if we need to delete by code
          ],
        })
        attendanceDeleted = attendanceResult.deletedCount
        console.log(`[API] Debug-subjects: Deleted ${attendanceDeleted} attendance records`)

        // Delete assessments
        const assessmentsResult = await db.collection("assessments").deleteMany({
          $or: [
            { subjectId: id },
            { subject: id },
            { subjectCode: { $exists: true } }, // This is a fallback if we need to delete by code
          ],
        })
        assessmentsDeleted = assessmentsResult.deletedCount
        console.log(`[API] Debug-subjects: Deleted ${assessmentsDeleted} assessment records`)
      }

      // Try with ObjectId
      try {
        const objectId = new ObjectId(id)
        deleteResult = await db.collection("subjects").deleteOne({ _id: objectId })
        console.log(`[API] Debug-subjects: Direct delete with ObjectId result:`, deleteResult)
      } catch (error) {
        console.log(`[API] Debug-subjects: Direct delete with ObjectId failed:`, error.message)
      }

      // If that didn't work, try with string ID
      if (!deleteResult || deleteResult.deletedCount === 0) {
        deleteResult = await db.collection("subjects").deleteOne({ _id: id })
        console.log(`[API] Debug-subjects: Direct delete with string ID result:`, deleteResult)
      }

      // If any delete succeeded
      if (deleteResult && deleteResult.deletedCount > 0) {
        return NextResponse.json({
          success: true,
          message: "Subject deleted successfully (direct delete)",
          attendanceDeleted,
          assessmentsDeleted,
        })
      }

      // If we couldn't delete the subject, try to remove it from the frontend cache
      return NextResponse.json({
        success: false,
        message: "Subject not found in database but marked for removal from frontend cache",
        id: id,
        action: "remove_from_cache",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error(`[API] Debug-subjects DELETE error:`, error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
