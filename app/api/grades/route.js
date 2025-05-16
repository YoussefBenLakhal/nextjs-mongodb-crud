import { getDB } from "@/lib/mongodb";
import { getSession } from "@/lib/server-auth";

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return Response.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { studentEmail, course, grade } = await req.json();
    
    // Validation
    if (!studentEmail || !course || grade === undefined) {
      return Response.json({ error: "Données manquantes" }, { status: 400 });
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

    // Insérer la note
    const result = await db.collection("grades").insertOne({
      studentId: student._id,
      teacherId: session.id,
      course,
      grade: Number(grade),
      date: new Date()
    });

    return Response.json({ 
      success: true,
      insertedId: result.insertedId 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}