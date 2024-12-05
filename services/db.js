require('dotenv').config(); // Load environment variables from .env file
const { MongoClient } = require('mongodb');

// Use environment variables for database connection
const url = process.env.MONGODB_URL; 
const dbName = process.env.DB_NAME;  

let db;

/**
 * Establish a connection to the MongoDB database.
 * Uses a singleton pattern to ensure only one connection is maintained.
 * @returns {Object} The connected database instance.
 */
const connectToDatabase = async () => {
  if (!db) {
    try {
      const client = new MongoClient(url);
      await client.connect(); 
      db = client.db(dbName); 
      console.log(`Connected to database: ${dbName}`);
    } catch (error) {
      console.error('Failed to connect to the database', error);
      throw error;
    }
  }
  return db;
};

module.exports = connectToDatabase;
