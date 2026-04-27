const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// Get all students
const getStudents = async (req, res) => {
    try {
        const db = getDB();
        
        const students = await db.collection('students').aggregate([
            {
                $lookup: {
                    from: "courses",
                    localField: "courses",
                    foreignField: "_id", // Match to native _id
                    as: "courses"
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single student
const getStudent = async (req, res) => {
    try {
        const db = getDB();
        
        const result = await db.collection('students').aggregate([
            { $match: { _id: new ObjectId(req.params.id) } }, // Native ObjectId matching
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
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create student
const createStudent = async (req, res) => {
    try {
        const db = getDB();
        const { studentId, name, email, courses } = req.body;
        const now = new Date().toISOString();

        const newStudent = {
            studentId,
            name,
            email,
            // Map incoming course IDs string to MongoDB ObjectIds
            courses: courses ? courses.map(id => new ObjectId(id)) : [],
            createdAt: now,
            updatedAt: now
        };

        const insertResult = await db.collection('students').insertOne(newStudent);
        
        // Return populated document
        const result = await db.collection('students').aggregate([
            { $match: { _id: insertResult.insertedId } },
            { $lookup: { from: "courses", localField: "courses", foreignField: "_id", as: "courses" } }
        ]).toArray();

        res.status(201).json(result[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update student
const updateStudent = async (req, res) => {
    try {
        const db = getDB();
        const { studentId, name, email, courses } = req.body;
        const now = new Date().toISOString();

        const updateDoc = {
            $set: {
                studentId,
                name,
                email,
                // Map incoming course IDs string to MongoDB ObjectIds
                courses: courses ? courses.map(id => new ObjectId(id)) : [],
                updatedAt: now
            }
        };

        const result = await db.collection('students').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            updateDoc,
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Fetch the updated, populated document
        const updatedRecord = await db.collection('students').aggregate([
            { $match: { _id: new ObjectId(req.params.id) } },
            { $lookup: { from: "courses", localField: "courses", foreignField: "_id", as: "courses" } }
        ]).toArray();

        res.json(updatedRecord[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete student
const deleteStudent = async (req, res) => {
    try {
        const db = getDB();
        
        const result = await db.collection('students').deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent
};