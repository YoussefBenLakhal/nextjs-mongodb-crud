import { redirect } from "next/navigation"
import { getSession } from "../../lib/server-auth"
import ClientDashboard from "./ClientDashboard"

export default async function StudentPage() {
  console.log("Student Dashboard: Checking session")
  const user = await getSession()

  if (!user) {
    console.log("Student Dashboard: No user found, redirecting to login")
    redirect("/login?redirect=/student-dashboard")
  }

  console.log("Student Dashboard: User found with role", user.role)
  if (user.role !== "student") {
    console.log("Student Dashboard: User is not a student, redirecting to unauthorized")
    redirect("/unauthorized")
  }

  console.log("Student Dashboard: Rendering dashboard for student")
  return <ClientDashboard user={user} />
}

// Ensure this page is not cached
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
