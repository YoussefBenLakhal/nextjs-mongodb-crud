import { NextResponse } from "next/server"
import { connectToDatabase } from "../../lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request) {
  try {
    // Get the subject ID from the URL
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('id')
    
    if (!subjectId) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }
    
    console.log("[TEST] Deleting subject with force=true:", subjectId)
    
    const { db } = await connectToDatabase()
    
    // First, get the subject to check its code
    const subject = await db.collection("subjects").findOne({ _id: new ObjectId(subjectId) })
    
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }
    
    // Delete attendance records
    const deleteAttendanceResult = await db.collection("attendance").deleteMany({
      subjectCode: subject.code,
    })
    
    console.log(`[TEST] Deleted ${deleteAttendanceResult.deletedCount} attendance records`)
    
    // Delete the subject
    const deleteSubjectResult = await db.collection("subjects").deleteOne({ _id: new ObjectId(subjectId) })
    
    if (deleteSubjectResult.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: `Subject and ${deleteAttendanceResult.deletedCount} attendance records deleted successfully`,
    })
  } catch (error) {
    console.error("[TEST] Error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}