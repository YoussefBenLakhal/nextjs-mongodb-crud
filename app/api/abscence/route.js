import { getDB } from "@/lib/mongodb";
import { getSession } from "@/lib/server-auth";

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return Response.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { studentEmail, course, count } = await req.json();
    
    // Validation
    if (!studentEmail || !course || count <= 0) {
      return Response.json({ error: "Données invalides" }, { status: 400 });
    }
    
    const db = await getDB();
    
    // Trouver l'étudiant
    const student = await db.collection("users").findOne({ 
      email: studentEmail.toLowerCase().trim(),
      role: "student"
    });
    
    if (!student) {
      return Response.json({ error: "Étudiant introuvable" }, { status: 404 });
    }

    // Générer les absences
    const absences = Array.from({ length: count }, () => ({
      studentId: student._id,
      teacherId: session.id,
      course,
      date: new Date(),
      status: "absent"
    }));

    const result = await db.collection("absences").insertMany(absences);

    return Response.json({
      success: true,
      insertedCount: result.insertedCount
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}