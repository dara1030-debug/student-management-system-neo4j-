document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:5001/api/dashboard/stats');
        const data = await response.json();

        // Display Aggregation 1: Counts
        document.getElementById('count-students').textContent = data.counts.students;
        document.getElementById('count-faculty').textContent = data.counts.faculty;
        document.getElementById('count-courses').textContent = data.counts.courses;

        // Display Aggregation 2: Top Courses
        const courseBody = document.getElementById('top-courses-body');
        data.topCourses.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.details.courseName}</td>
                <td><strong>${item.count}</strong> Students</td>
            `;
            courseBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
});