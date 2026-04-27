const API_URL = 'http://localhost:5001/api/faculty';
const COURSES_API_URL = 'http://localhost:5001/api/courses';

const form = document.getElementById('faculty-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const facultyIdInput = document.getElementById('faculty-id'); // Hidden MongoDB _id
const nameInput = document.getElementById('name');
const addressInput = document.getElementById('address');
const departmentInput = document.getElementById('department');
const coursesSelect = document.getElementById('courses');
const tbody = document.getElementById('faculty-tbody');
const noFacultyMsg = document.getElementById('no-faculty');
const searchInput = document.getElementById('search-input');
let allFaculties = [];

let isEditing = false;
let allCourses = [];

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCoursesForSelect();
    await fetchFaculties();
});

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', resetForm);

async function fetchCoursesForSelect() {
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

async function fetchFaculties() {
    try {
        const response = await fetch(API_URL);
        allFaculties = await response.json(); // Store in our global array
        renderFaculties(allFaculties);         // Initial render
    } catch (error) {
        console.error('Error fetching faculty:', error);
    }
}
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        const filtered = allFaculties.filter(faculty => {
            const nameMatch = faculty.name && faculty.name.toLowerCase().includes(searchTerm);
            const deptMatch = faculty.department && faculty.department.toLowerCase().includes(searchTerm);
            
            // Check if any taught courses match
            const courseMatch = faculty.courses && faculty.courses.some(c => 
                (c.courseCode && c.courseCode.toLowerCase().includes(searchTerm)) || 
                (c.courseName && c.courseName.toLowerCase().includes(searchTerm))
            );
            
            return nameMatch || deptMatch || courseMatch;
        });
        
        renderFaculties(filtered);
    });
}

function renderFaculties(faculties) {
    tbody.innerHTML = '';

    if (faculties.length === 0) {
        noFacultyMsg.classList.remove('hidden');
        return;
    }

    noFacultyMsg.classList.add('hidden');

    faculties.forEach(faculty => {
        const row = document.createElement('tr');
        
        // Transform the courses into HTML Badges!
        const courseBadges = faculty.courses && faculty.courses.length > 0
            ? faculty.courses.map(c => `<span class="badge">${escapeHtml(c.courseCode)}</span>`).join('')
            : '<span style="color: #999; font-size: 0.9em;">None</span>';
            
        row.innerHTML = `
            <td><strong>${escapeHtml(faculty.name)}</strong></td>
            <td>${escapeHtml(faculty.address)}</td>
            <td>${escapeHtml(faculty.department)}</td>
            <td>${courseBadges}</td>
            <td>
                <button class="btn-edit" onclick="editFaculty('${faculty._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteFaculty('${faculty._id}')" title="Delete">
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

    const facultyData = {
        name: nameInput.value.trim(),
        address: addressInput.value.trim(),
        department: departmentInput.value.trim(),
        courses: getSelectedCourses()
    };

    try {
        if (isEditing) {
            await fetch(`${API_URL}/${facultyIdInput.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facultyData)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facultyData)
            });
        }

        resetForm();
        fetchFaculties();
    } catch (error) {
        console.error('Error saving faculty:', error);
    }
}

async function editFaculty(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const faculty = await response.json();

        facultyIdInput.value = faculty._id;
        nameInput.value = faculty.name;
        addressInput.value = faculty.address;
        departmentInput.value = faculty.department;

        // Extract IDs from populated course objects
        const courseIds = faculty.courses ? faculty.courses.map(c => c._id) : [];
        populateCourseSelect(courseIds);

        isEditing = true;
        formTitle.textContent = 'Edit Faculty';
        submitBtn.textContent = 'Update Faculty';
        cancelBtn.classList.remove('hidden');

        nameInput.focus();
    } catch (error) {
        console.error('Error fetching faculty:', error);
    }
}

async function deleteFaculty(id) {
    if (!confirm('Are you sure you want to delete this faculty member?')) {
        return;
    }

    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchFaculties();
    } catch (error) {
        console.error('Error deleting faculty:', error);
    }
}

function resetForm() {
    form.reset();
    facultyIdInput.value = '';
    isEditing = false;
    formTitle.textContent = 'Add New Faculty';
    submitBtn.textContent = 'Add Faculty';
    cancelBtn.classList.add('hidden');
    populateCourseSelect([]);
}