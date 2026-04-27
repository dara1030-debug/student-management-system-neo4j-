const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// Get all faculty
const getFaculties = async (req, res) => {
    try {
        const db = getDB();
        const faculties = await db.collection('faculty').aggregate([
            {
                $lookup: {
                    from: "courses",
                    localField: "courses", // Array of ObjectIds
                    foreignField: "_id",   // Matches the MongoDB _id
                    as: "courses"
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json(faculties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single faculty
const getFaculty = async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('faculty').aggregate([
            { $match: { _id: new ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: "courses",
                    localField: "courses",
                    foreignField: "_id",
                    as: "courses"
                }
            }
        ]).toArray();

        if (result.length === 0) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create faculty
const createFaculty = async (req, res) => {
    try {
        const db = getDB();
        const { name, address, department, courses } = req.body;
        const now = new Date().toISOString();

        const newFaculty = {
            name,
            address,
            department,
            // Convert incoming course string IDs into real MongoDB ObjectIds
            courses: courses ? courses.map(id => new ObjectId(id)) : [],
            createdAt: now,
            updatedAt: now
        };

        const insertResult = await db.collection('faculty').insertOne(newFaculty);
        
        // Fetch it back to return the populated data
        const result = await db.collection('faculty').aggregate([
            { $match: { _id: insertResult.insertedId } },
            { $lookup: { from: "courses", localField: "courses", foreignField: "_id", as: "courses" } }
        ]).toArray();

        res.status(201).json(result[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update faculty
const updateFaculty = async (req, res) => {
    try {
        const db = getDB();
        const { name, address, department, courses } = req.body;
        const now = new Date().toISOString();

        const updateDoc = {
            $set: {
                name,
                address,
                department,
                // Convert incoming course string IDs into real MongoDB ObjectIds
                courses: courses ? courses.map(id => new ObjectId(id)) : [],
                updatedAt: now
            }
        };

        const result = await db.collection('faculty').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            updateDoc,
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        
        // Fetch updated record with populated courses
        const updatedRecord = await db.collection('faculty').aggregate([
            { $match: { _id: new ObjectId(req.params.id) } },
            { $lookup: { from: "courses", localField: "courses", foreignField: "_id", as: "courses" } }
        ]).toArray();

        res.json(updatedRecord[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete faculty
const deleteFaculty = async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('faculty').deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        res.json({ message: 'Faculty deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFaculties,
    getFaculty,
    createFaculty,
    updateFaculty,
    deleteFaculty
};