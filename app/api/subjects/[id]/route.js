import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth.js"

// Get a specific subject
export async function GET(request, { params }) {
  try {
    console.log(`[API] GET /api/subjects/${params.id}`)

    const { db } = await connectToDatabase()

    // Try to use ObjectId, but fall back to string ID for hardcoded subjects
    let query = { _id: params.id }
    try {
      query = { _id: new ObjectId(params.id) }
    } catch (error) {
      console.log(`[API] ID ${params.id} is not a valid ObjectId, using as string`)
    }

    const subject = await db.collection("subjects").findOne(query)

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
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
  } catch (error) {
    console.error(`[API] Subject GET error:`, error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Update a subject
export async function PUT(request, { params }) {
  try {
    console.log(`[API] PUT /api/subjects/${params.id}`)

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
        { error: "Unauthorized - Only teachers and admins can update subjects" },
        { status: 401 },
      )
    }

    const { db } = await connectToDatabase()

    // Try to use ObjectId, but fall back to string ID for hardcoded subjects
    let query = { _id: params.id }
    try {
      query = { _id: new ObjectId(params.id) }
    } catch (error) {
      console.log(`[API] ID ${params.id} is not a valid ObjectId, using as string`)
    }

    // Get existing subject
    const existingSubject = await db.collection("subjects").findOne(query)

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if user is authorized to update this subject
    // Skip this check for hardcoded subjects with string IDs
    const isHardcodedSubject = typeof existingSubject._id === "string"
    if (!isHardcodedSubject && userRole !== "admin" && existingSubject.teacherId?.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized - You can only update your own subjects" }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    // Check if subject code already exists for this class (excluding current subject)
    if (code !== existingSubject.code) {
      const codeExists = await db.collection("subjects").findOne({
        _id: { $ne: existingSubject._id },
        classId: existingSubject.classId,
        code: code,
      })

      if (codeExists) {
        return NextResponse.json({ error: "Subject code already exists for this class" }, { status: 409 })
      }
    }

    // Update subject
    const updateResult = await db.collection("subjects").updateOne(query, {
      $set: {
        name,
        code,
        description: description || "",
        updatedAt: new Date(),
        updatedBy: new ObjectId(userId),
      },
    })

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Subject updated successfully",
    })
  } catch (error) {
    console.error(`[API] Subject PUT error:`, error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Delete a subject
export async function DELETE(request, { params }) {
  try {
    console.log(`[API] DELETE /api/subjects/${params.id} - Starting deletion process`)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get("force") === "true"
    const subjectName = searchParams.get("name")
    const subjectCode = searchParams.get("code")

    console.log(`[API] Force delete parameter: ${forceDelete}`)
    console.log(`[API] Subject name: ${subjectName}, code: ${subjectCode}`)

    // Special case for hardcoded subjects with simple string IDs
    if (params.id.startsWith("subj") || params.id.startsWith("fallback")) {
      console.log(`[API] Handling delete for hardcoded subject: ${params.id}`)

      // For hardcoded subjects, we just return success without checking auth
      // since these aren't real database entries anyway
      return NextResponse.json({
        success: true,
        message: "Hardcoded subject removed successfully",
        isHardcoded: true,
      })
    }

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role
    console.log(`[API] User role: ${userRole}, User ID: ${userId}`)

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can delete subjects" },
        { status: 401 },
      )
    }

    const { db } = await connectToDatabase()

    // Try multiple query approaches to find the subject
    let subject = null
    let query = null
    let objectId = null

    // Approach 1: Try with ObjectId
    try {
      objectId = new ObjectId(params.id)
      console.log(`[API] Trying to find subject with ObjectId: ${objectId}`)
      subject = await db.collection("subjects").findOne({ _id: objectId })
      if (subject) {
        query = { _id: objectId }
        console.log(`[API] Found subject with ObjectId`)
      }
    } catch (error) {
      console.log(`[API] ID ${params.id} is not a valid ObjectId or subject not found with ObjectId: ${error.message}`)
    }

    // Approach 2: Try with string ID
    if (!subject) {
      console.log(`[API] Trying to find subject with string ID: ${params.id}`)
      subject = await db.collection("subjects").findOne({ _id: params.id })
      if (subject) {
        query = { _id: params.id }
        console.log(`[API] Found subject with string ID`)
      }
    }

    // Approach 3: Try with additional fields
    if (!subject && subjectName && subjectCode) {
      console.log(`[API] Trying to find subject with name: ${subjectName} and code: ${subjectCode}`)
      subject = await db.collection("subjects").findOne({
        name: subjectName,
        code: subjectCode,
      })
      if (subject) {
        query = { _id: subject._id }
        console.log(`[API] Found subject with name and code: ${subject._id}`)
      }
    }

    // If subject is still not found, try a direct delete
    if (!subject) {
      console.log(`[API] Subject not found with any query method, attempting direct delete`)

      // Try multiple delete approaches
      let deleteResult = null

      // Try with ObjectId
      if (objectId) {
        console.log(`[API] Attempting direct delete with ObjectId: ${objectId}`)
        deleteResult = await db.collection("subjects").deleteOne({ _id: objectId })
        console.log(`[API] Direct delete with ObjectId result:`, deleteResult)
      }

      // If that didn't work, try with string ID
      if (!deleteResult || deleteResult.deletedCount === 0) {
        console.log(`[API] Attempting direct delete with string ID: ${params.id}`)
        deleteResult = await db.collection("subjects").deleteOne({ _id: params.id })
        console.log(`[API] Direct delete with string ID result:`, deleteResult)
      }

      // Last resort: try to delete by name and code if provided
      if ((!deleteResult || deleteResult.deletedCount === 0) && subjectName && subjectCode) {
        console.log(`[API] Attempting direct delete with name: ${subjectName} and code: ${subjectCode}`)
        deleteResult = await db.collection("subjects").deleteOne({
          name: subjectName,
          code: subjectCode,
        })
        console.log(`[API] Delete by name and code result:`, deleteResult)
      }

      // If any delete succeeded
      if (deleteResult && deleteResult.deletedCount > 0) {
        console.log(`[API] Subject deleted successfully via direct delete`)
        return NextResponse.json({
          success: true,
          message: "Subject deleted successfully (direct delete)",
        })
      }

      // If we got here, we couldn't find or delete the subject
      console.log(`[API] Subject not found or could not be deleted: ${params.id}`)
      return NextResponse.json(
        {
          error: "Subject not found",
          id: params.id,
          message: "The subject could not be found in the database. It may have been deleted already.",
        },
        { status: 404 },
      )
    }

    console.log(`[API] Subject details:`, {
      id: subject._id,
      name: subject.name,
      code: subject.code,
      teacherId: subject.teacherId,
    })

    // Skip authorization checks for subjects without classId (likely test subjects)
    const isTestSubject = !subject.classId && subject.teacher

    // Check if user is authorized to delete this subject
    // Skip this check for hardcoded subjects with string IDs or test subjects
    const isHardcodedSubject = typeof subject._id === "string"
    if (!isHardcodedSubject && !isTestSubject && userRole !== "admin") {
      if (!subject.teacherId) {
        console.log(`[API] Subject has no teacherId, checking if user is creator`)
        // If no teacherId, check if user is the creator
        if (subject.createdBy && subject.createdBy.toString() !== userId) {
          console.log(`[API] User is not the creator of this subject`)
          return NextResponse.json(
            { error: "Unauthorized - You can only delete subjects you created" },
            { status: 401 },
          )
        }
      } else if (subject.teacherId.toString() !== userId) {
        console.log(`[API] User is not the teacher of this subject`)
        return NextResponse.json({ error: "Unauthorized - You can only delete your own subjects" }, { status: 401 })
      }
    }

    // For test subjects without classId, skip attendance and assessment checks
    if (!isTestSubject) {
      // Check if there are attendance records for this subject
      const subjectIdStr = subject._id.toString ? subject._id.toString() : subject._id
      const attendanceQuery = {
        $or: [
          { subjectId: subject._id },
          { subjectId: subjectIdStr },
          { subjectCode: subject.code },
          { subject: subject._id },
          { subject: subjectIdStr },
        ],
      }

      console.log(`[API] Checking for attendance records with query:`, attendanceQuery)
      const attendanceCount = await db.collection("attendance").countDocuments(attendanceQuery)
      console.log(`[API] Found ${attendanceCount} attendance records for subject ${params.id}`)

      if (attendanceCount > 0 && !forceDelete) {
        return NextResponse.json(
          {
            error: "Cannot delete subject with attendance records",
            attendanceCount,
            message: "This subject has attendance records. Use force delete to remove it and all associated records.",
          },
          { status: 400 },
        )
      }

      // Delete attendance records if force delete
      if (attendanceCount > 0 && forceDelete) {
        console.log(`[API] Force deleting ${attendanceCount} attendance records`)
        const deleteAttendanceResult = await db.collection("attendance").deleteMany(attendanceQuery)
        console.log(`[API] Deleted ${deleteAttendanceResult.deletedCount} attendance records`)
      }

      // Check if there are grades/assessments for this subject
      const assessmentQuery = {
        $or: [
          { subjectId: subject._id },
          { subjectId: subjectIdStr },
          { subjectCode: subject.code },
          { subject: subject._id },
          { subject: subjectIdStr },
        ],
      }

      console.log(`[API] Checking for assessments with query:`, assessmentQuery)
      const assessmentCount = await db.collection("assessments").countDocuments(assessmentQuery)
      console.log(`[API] Found ${assessmentCount} assessments for subject ${params.id}`)

      if (assessmentCount > 0 && !forceDelete) {
        return NextResponse.json(
          {
            error: "Cannot delete subject with assessments",
            assessmentCount,
            message: "This subject has assessments/grades. Use force delete to remove it and all associated records.",
          },
          { status: 400 },
        )
      }

      // Delete assessments if force delete
      if (assessmentCount > 0 && forceDelete) {
        console.log(`[API] Force deleting ${assessmentCount} assessments`)
        const deleteAssessmentsResult = await db.collection("assessments").deleteMany(assessmentQuery)
        console.log(`[API] Deleted ${deleteAssessmentsResult.deletedCount} assessments`)
      }
    }

    // Delete subject
    console.log(`[API] Deleting subject with query:`, query)
    const deleteResult = await db.collection("subjects").deleteOne(query)
    console.log(`[API] Delete result:`, deleteResult)

    if (deleteResult.deletedCount === 0) {
      console.log(`[API] Subject found but could not be deleted: ${params.id}`)
      return NextResponse.json(
        {
          error: "Subject could not be deleted",
          message: "The subject was found but could not be deleted. This may be due to a database constraint.",
        },
        { status: 500 },
      )
    }

    console.log(`[API] Subject deleted successfully: ${params.id}`)
    return NextResponse.json({
      success: true,
      message: "Subject deleted successfully",
      isTestSubject: isTestSubject,
      deletedCount: deleteResult.deletedCount,
    })
  } catch (error) {
    console.error(`[API] Subject DELETE error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
