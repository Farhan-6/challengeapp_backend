import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log("Database connected Successfully");
    return db;
  } catch (error) {
    console.error(" Database connection failed:", error.message);
  }
};


export default connectDB;
