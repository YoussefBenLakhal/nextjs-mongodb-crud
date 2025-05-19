import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    console.log("[API] GET /api/seed-attendance - Generating sample attendance data")

    // Generate sample attendance data
    const sampleAttendance = generateSampleAttendanceData()

    return NextResponse.json({ attendance: sampleAttendance })
  } catch (error) {
    console.error("[API] Sample attendance generation error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Generate sample attendance data
function generateSampleAttendanceData() {
  const mockAttendance = []
  const now = new Date()
  const subjects = [
    { _id: "subj1", name: "Mathematics" },
    { _id: "subj2", name: "Science" },
    { _id: "subj3", name: "History" },
    { _id: "subj4", name: "English" },
  ]

  // Create 20 days of attendance records
  for (let i = 0; i < 20; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Skip weekends
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    // Randomly select a subject
    const subject = subjects[Math.floor(Math.random() * subjects.length)]

    // Determine status (80% present, 10% late, 10% absent)
    const rand = Math.random()
    let status = "present"
    let comment = ""

    if (rand > 0.9) {
      status = "absent"
      comment = "Student was absent"
    } else if (rand > 0.8) {
      status = "late"
      comment = "Student arrived 10 minutes late"
    }

    mockAttendance.push({
      _id: `mock-${i}`,
      date: date.toISOString(),
      subjectId: subject._id,
      status: status,
      comment: comment,
    })
  }

  return mockAttendance
}

export const dynamic = "force-dynamic"
