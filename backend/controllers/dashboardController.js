const { getDB } = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const db = getDB();

        // Global Counts (Basic Data Overview)
        const studentCount = await db.collection('students').countDocuments();
        const facultyCount = await db.collection('faculty').countDocuments();
        const courseCount = await db.collection('courses').countDocuments();

        //  Most Enrolled Courses (Top 5)
        //  uses $unwind to flatten the arrays and $group to count them
        const topCourses = await db.collection('students').aggregate([
            { $unwind: "$courses" },
            { $group: { _id: "$courses", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "_id",
                    as: "details"
                }
            },
            { $unwind: "$details" }
        ]).toArray();

        // Faculty Distribution by Department
        const deptStats = await db.collection('faculty').aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        res.json({
            counts: { students: studentCount, faculty: facultyCount, courses: courseCount },
            topCourses,
            deptStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };