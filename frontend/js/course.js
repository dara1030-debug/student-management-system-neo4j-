const API_URL = 'http://localhost:5001/api/courses';

const form = document.getElementById('course-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const courseIdInput = document.getElementById('course-id'); // Hidden MongoDB _id
const courseCodeInput = document.getElementById('course-code');
const courseNameInput = document.getElementById('course-name');
const descriptionInput = document.getElementById('description');
const creditsInput = document.getElementById('credits');
const tbody = document.getElementById('course-tbody');
const noCoursesMsg = document.getElementById('no-courses');
const searchInput = document.getElementById('search-input');
let allCourses = [];

let isEditing = false;

document.addEventListener('DOMContentLoaded', fetchCourses);

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', resetForm);

async function fetchCourses() {
    try {
        const response = await fetch(API_URL);
        allCourses = await response.json();
        renderCourses(allCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        const filtered = allCourses.filter(course => {
            const codeMatch = course.courseCode && course.courseCode.toLowerCase().includes(searchTerm);
            const nameMatch = course.courseName && course.courseName.toLowerCase().includes(searchTerm);
            const descMatch = course.description && course.description.toLowerCase().includes(searchTerm);
            
            return codeMatch || nameMatch || descMatch;
        });
        
        renderCourses(filtered);
    });
}

function renderCourses(courses) {
    tbody.innerHTML = '';

    if (courses.length === 0) {
        noCoursesMsg.classList.remove('hidden');
        return;
    }

    noCoursesMsg.classList.add('hidden');

    courses.forEach(course => {
        const row = document.createElement('tr');
        
        // Transform lists into HTML Badges
        const studentBadges = course.students && course.students.length > 0
            ? course.students.map(s => `<span class="badge" style="background: #e3f2fd; color: #1976d2; border-color: #bbdefb;">${escapeHtml(s.name)}</span>`).join('')
            : '-';
            
        const facultyBadges = course.faculty && course.faculty.length > 0
            ? course.faculty.map(f => `<span class="badge" style="background: #f3e5f5; color: #7b1fa2; border-color: #e1bee7;">${escapeHtml(f.name)}</span>`).join('')
            : '-';
            
        row.innerHTML = `
            <td><strong>${escapeHtml(course.courseCode)}</strong></td>
            <td>${escapeHtml(course.courseName)}</td>
            <td>${escapeHtml(course.description || '-')}</td>
            <td>${course.credits ?? '-'}</td>
            <td>${studentBadges}</td>
            <td>${facultyBadges}</td>
            <td>
                <button class="btn-edit" onclick="editCourse('${course._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteCourse('${course._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleSubmit(e) {
    e.preventDefault();

    const courseData = {
        courseCode: courseCodeInput.value.trim(),
        courseName: courseNameInput.value.trim(),
        description: descriptionInput.value.trim(),
        credits: creditsInput.value ? Number(creditsInput.value) : null
    };

    try {
        if (isEditing) {
            await fetch(`${API_URL}/${courseIdInput.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            });
        }

        resetForm();
        fetchCourses();
    } catch (error) {
        console.error('Error saving course:', error);
    }
}

async function editCourse(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const course = await response.json();

        courseIdInput.value = course._id;
        courseCodeInput.value = course.courseCode;
        courseNameInput.value = course.courseName;
        descriptionInput.value = course.description || '';
        creditsInput.value = course.credits ?? '';

        isEditing = true;
        formTitle.textContent = 'Edit Course';
        submitBtn.textContent = 'Update Course';
        cancelBtn.classList.remove('hidden');

        courseCodeInput.focus();
    } catch (error) {
        console.error('Error fetching course:', error);
    }
}

async function deleteCourse(id) {
    if (!confirm('Are you sure you want to delete this course?')) {
        return;
    }

    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchCourses();
    } catch (error) {
        console.error('Error deleting course:', error);
    }
}

function resetForm() {
    form.reset();
    courseIdInput.value = '';
    isEditing = false;
    formTitle.textContent = 'Add New Course';
    submitBtn.textContent = 'Add Course';
    cancelBtn.classList.add('hidden');
}