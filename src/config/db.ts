import { MongoClient, Db, Collection } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let db: Db;
export let usersCollection: Collection;
let mongoServer: MongoMemoryServer | undefined;
let client: MongoClient;

const useInMemoryDatabase = process.env.NODE_ENV === "test"; // Use in-memory DB if testing

export const connectToDatabase = async (): Promise<void> => {
  if (useInMemoryDatabase) {
    // Use in-memory MongoDB server for testing
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("test"); // Database name for in-memory
  } else {
    // Use real MongoDB connection for other environments
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MongoDB URI is not defined");
    }
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("user"); // Replace with your production database name if different
  }

  usersCollection = db.collection("users"); // Replace with your collection name if different
  console.log("Connected to MongoDB");
};

export const closeDatabase = async (): Promise<void> => {
  if (useInMemoryDatabase && mongoServer) {
    await client.close();
    await mongoServer.stop();
  } else if (client) {
    await client.close();
  }
};
