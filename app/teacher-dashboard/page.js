import { redirect } from "next/navigation"
import { getSession } from "../../lib/server-auth"
import ClientDashboard from "./ClientDashboard"

export default async function TeacherDashboardPage() {
  console.log("Teacher Dashboard: Checking session")
  const user = await getSession()

  if (!user) {
    console.log("Teacher Dashboard: No user found, redirecting to login")
    redirect("/login?redirect=/teacher-dashboard")
  }

  console.log("Teacher Dashboard: User found with role", user.role)
  if (user.role !== "teacher") {
    console.log("Teacher Dashboard: User is not a teacher, redirecting to unauthorized")
    redirect("/unauthorized")
  }

  console.log("Teacher Dashboard: Rendering dashboard for teacher")
  return <ClientDashboard user={user} />
}

// Ensure this page is not cached
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
