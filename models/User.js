import { MongoClient } from "mongodb"

let client
let db

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    // FIXED: Always use ProjetClasse, not school_management
    db = client.db(process.env.MONGODB_DB || "ProjetClasse")
    console.log(`[USER MODEL] Connected to database: ${db.databaseName}`)
  }
  return { client, db }
}

export class User {
  static async find(query = {}) {
    const { db } = await connectToDatabase()
    return await db.collection("users").find(query).toArray()
  }

  static async findOne(query) {
    const { db } = await connectToDatabase()
    return await db.collection("users").findOne(query)
  }

  static async create(data) {
    const { db } = await connectToDatabase()
    const result = await db.collection("users").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { ...data, _id: result.insertedId }
  }

  static async updateOne(query, update) {
    const { db } = await connectToDatabase()
    return await db.collection("users").updateOne(query, {
      ...update,
      $set: { ...update.$set, updatedAt: new Date() },
    })
  }

  static async deleteOne(query) {
    const { db } = await connectToDatabase()
    return await db.collection("users").deleteOne(query)
  }
}

export default User
