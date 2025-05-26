import { MongoClient } from "mongodb"

let client
let db

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    // FIXED: Always use ProjetClasse, not school_management
    db = client.db(process.env.MONGODB_DB || "ProjetClasse")
    console.log(`[ASSESSMENT MODEL] Connected to database: ${db.databaseName}`)
  }
  return { client, db }
}

export class Assessment {
  static async find(query = {}) {
    const { db } = await connectToDatabase()
    return await db.collection("assessments").find(query).toArray()
  }

  static async findOne(query) {
    const { db } = await connectToDatabase()
    return await db.collection("assessments").findOne(query)
  }

  static async create(data) {
    const { db } = await connectToDatabase()
    const result = await db.collection("assessments").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { ...data, _id: result.insertedId }
  }

  static async updateOne(query, update) {
    const { db } = await connectToDatabase()
    return await db.collection("assessments").updateOne(query, {
      ...update,
      $set: { ...update.$set, updatedAt: new Date() },
    })
  }

  static async deleteOne(query) {
    const { db } = await connectToDatabase()
    return await db.collection("assessments").deleteOne(query)
  }

  static async aggregate(pipeline) {
    const { db } = await connectToDatabase()
    return await db.collection("assessments").aggregate(pipeline).toArray()
  }
}

export default Assessment
