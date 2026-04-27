const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// Get all courses (Now with Aggregation Lookups!)
const getCourses = async (req, res) => {
    try {
        const db = getDB();
        
        // 1. FILTER REQUIREMENT: Create an empty query object
        let matchQuery = {};
        
        // If the URL has "?credits=3", add it to our filter!
        if (req.query.credits) {
            matchQuery.credits = Number(req.query.credits);
        }

        const courses = await db.collection('courses').aggregate([
            // 2. Apply the filter right at the beginning
            { $match: matchQuery }, 
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "courses",
                    as: "students"
                }
            },
            {
                $lookup: {
                    from: "faculty",
                    localField: "_id",
                    foreignField: "courses",
                    as: "faculty"
                }
            },
            // 3. SORT REQUIREMENT
            { $sort: { createdAt: -1 } } 
        ]).toArray();

        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get single course
const getCourse = async (req, res) => {
    try {
        const db = getDB();
        
        const result = await db.collection('courses').aggregate([
            { $match: { _id: new ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "courses",
                    as: "students"
                }
            },
            {
                $lookup: {
                    from: "faculty",
                    localField: "_id",
                    foreignField: "courses",
                    as: "faculty"
                }
            }
        ]).toArray();
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create course
const createCourse = async (req, res) => {
    try {
        const db = getDB();
        const { courseCode, courseName, description, credits } = req.body;
        const now = new Date().toISOString();

        const newCourse = {
            courseCode,
            courseName,
            description,
            credits: Number(credits),
            createdAt: now,
            updatedAt: now
        };

        const result = await db.collection('courses').insertOne(newCourse);
        const insertedCourse = await db.collection('courses').findOne({ _id: result.insertedId });
        res.status(201).json(insertedCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update course
const updateCourse = async (req, res) => {
    try {
        const db = getDB();
        const { courseCode, courseName, description, credits } = req.body;
        const now = new Date().toISOString();

        const updateDoc = {
            $set: {
                courseCode,
                courseName,
                description,
                credits: Number(credits),
                updatedAt: now
            }
        };

        const result = await db.collection('courses').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            updateDoc,
            { returnDocument: 'after' }
        );

        const docToReturn = result.value || result;
        if (!docToReturn) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(docToReturn);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete course
const deleteCourse = async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('courses').deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse
};