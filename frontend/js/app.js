const API_URL = 'http://localhost:5001/api/students';
const COURSES_API_URL = 'http://localhost:5001/api/courses';

const form = document.getElementById('student-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const studentIdInput = document.getElementById('student-id'); // Hidden MongoDB _id
const studentIdFieldInput = document.getElementById('student-id-field'); // Actual School ID
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const coursesSelect = document.getElementById('courses');
const tbody = document.getElementById('students-tbody');
const noStudentsMsg = document.getElementById('no-students');
const searchInput = document.getElementById('search-input'); // search bar

let isEditing = false;
let allCourses = [];
let allStudents = []; //  store all fetched students for  filtering

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCourses();
    await fetchStudents();
});

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', resetForm);

// Add Course search to the live filtering
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        const filteredStudents = allStudents.filter(student => {
            const nameMatch = student.name && student.name.toLowerCase().includes(searchTerm);
            const idMatch = student.studentId && student.studentId.toLowerCase().includes(searchTerm);
            const emailMatch = student.email && student.email.toLowerCase().includes(searchTerm);
            
            //  Check if any of the enrolled courses match the search term
            const courseMatch = student.courses && student.courses.some(course => {
                const codeMatch = course.courseCode && course.courseCode.toLowerCase().includes(searchTerm);
                const titleMatch = course.courseName && course.courseName.toLowerCase().includes(searchTerm);
                return codeMatch || titleMatch;
            });
            
            // Return true if ANY of these fields match
            return nameMatch || idMatch || emailMatch || courseMatch;
        });
        
        renderStudents(filteredStudents);
    });
}

async function fetchCourses() {
    try {
        const response = await fetch(COURSES_API_URL);
        allCourses = await response.json();
        populateCourseSelect();
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

function populateCourseSelect(selectedIds = []) {
    coursesSelect.innerHTML = '';
    allCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course._id;
        option.textContent = `${course.courseCode} - ${course.courseName}`;
        if (selectedIds.includes(course._id)) {
            option.selected = true;
        }
        coursesSelect.appendChild(option);
    });
}

function getSelectedCourses() {
    const selected = [];
    for (const option of coursesSelect.options) {
        if (option.selected) {
            selected.push(option.value);
        }
    }
    return selected;
}

async function fetchStudents() {
    try {
        const response = await fetch(API_URL);
        allStudents = await response.json(); 
        renderStudents(allStudents);         // Initial render of all data
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

function renderStudents(students) {
    tbody.innerHTML = '';

    if (students.length === 0) {
        noStudentsMsg.classList.remove('hidden');
        return;
    }

    noStudentsMsg.classList.add('hidden');

    students.forEach(student => {
        const row = document.createElement('tr');
        
        // Transform the courses into HTML Badges!
        const courseBadges = student.courses && student.courses.length > 0
            ? student.courses.map(c => `<span class="badge">${escapeHtml(c.courseCode)}</span>`).join('')
            : '<span style="color: #999; font-size: 0.9em;">None</span>';
            
        row.innerHTML = `
            <td><strong>${escapeHtml(student.studentId || '-')}</strong></td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${courseBadges}</td>
           <td>
                <button class="btn-edit" onclick="editStudent('${student._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteStudent('${student._id}')" title="Delete">
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

    const studentData = {
        studentId: studentIdFieldInput.value.trim(),
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        courses: getSelectedCourses()
    };

    try {
        if (isEditing) {
            await fetch(`${API_URL}/${studentIdInput.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
        }

        resetForm();
        fetchStudents();
        // Clear search bar on submit to show full new list
        if(searchInput) searchInput.value = ''; 
    } catch (error) {
        console.error('Error saving student:', error);
    }
}

async function editStudent(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const student = await response.json();

        studentIdInput.value = student._id;
        studentIdFieldInput.value = student.studentId || '';
        nameInput.value = student.name;
        emailInput.value = student.email;

        // Extract IDs from the populated course objects
        const courseIds = student.courses ? student.courses.map(c => c._id) : [];
        populateCourseSelect(courseIds);

        isEditing = true;
        formTitle.textContent = 'Edit Student';
        submitBtn.textContent = 'Update Student';
        cancelBtn.classList.remove('hidden');

        studentIdFieldInput.focus();
    } catch (error) {
        console.error('Error fetching student:', error);
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }

    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchStudents();
        // Clear search bar on delete
        if(searchInput) searchInput.value = ''; 
    } catch (error) {
        console.error('Error deleting student:', error);
    }
}

function resetForm() {
    form.reset();
    studentIdInput.value = '';
    isEditing = false;
    formTitle.textContent = 'Add New Student';
    submitBtn.textContent = 'Add Student';
    cancelBtn.classList.add('hidden');
    populateCourseSelect([]);
}