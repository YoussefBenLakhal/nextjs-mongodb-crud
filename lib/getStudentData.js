// /lib/getStudentData.js

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import Student from "@/models/Student";

export default async function getStudentData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await connectToDB();
  const student = await Student.findOne({ email: session.user.email }).lean();
  return student;
}
