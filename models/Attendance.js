import { MongoClient } from "mongodb"

let client
let db

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    // FIXED: Always use ProjetClasse, not school_management
    db = client.db(process.env.MONGODB_DB || "ProjetClasse")
    console.log(`[ATTENDANCE MODEL] Connected to database: ${db.databaseName}`)
  }
  return { client, db }
}

export class Attendance {
  static async find(query = {}) {
    const { db } = await connectToDatabase()
    return await db.collection("attendances").find(query).toArray()
  }

  static async findOne(query) {
    const { db } = await connectToDatabase()
    return await db.collection("attendances").findOne(query)
  }

  static async create(data) {
    const { db } = await connectToDatabase()
    const result = await db.collection("attendances").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { ...data, _id: result.insertedId }
  }

  static async updateOne(query, update) {
    const { db } = await connectToDatabase()
    return await db.collection("attendances").updateOne(query, {
      ...update,
      $set: { ...update.$set, updatedAt: new Date() },
    })
  }

  static async deleteOne(query) {
    const { db } = await connectToDatabase()
    return await db.collection("attendances").deleteOne(query)
  }

  static async aggregate(pipeline) {
    const { db } = await connectToDatabase()
    return await db.collection("attendances").aggregate(pipeline).toArray()
  }
}

export default Attendance
