const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

const client = new MongoClient(uri);
let dbConnection;

const connectDB = async () => {
    try {
        await client.connect();
        dbConnection = client.db(dbName);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const getDB = () => {
    if (!dbConnection) throw new Error('Call connectDB first in your server.js');
    return dbConnection;
};

module.exports = { connectDB, getDB, client };