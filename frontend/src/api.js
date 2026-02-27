import axios from 'axios';

let BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Ensure the base URL ends with /api if it doesn't already
if (process.env.REACT_APP_API_URL && !process.env.REACT_APP_API_URL.endsWith('/api')) {
  BASE_URL = process.env.REACT_APP_API_URL.endsWith('/')
    ? `${process.env.REACT_APP_API_URL}api`
    : `${process.env.REACT_APP_API_URL}/api`;
}

const API = axios.create({
  baseURL: BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('vectorAdminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AcademicAPI = axios.create({
  baseURL: BASE_URL,
});

AcademicAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('vectorAcademicToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ==================== CMS CONTENT APIs ====================

export const fetchHero = () => API.get('/content/hero');
export const updateHero = (data) => API.put('/content/hero', data);

export const fetchCollegeInfo = () => API.get('/content/college-info');
export const updateCollegeInfo = (data) => API.put('/content/college-info', data);

export const submitEnquiry = (data) => API.post('/content/enquiries', data);
export const fetchEnquiries = () => API.get('/content/enquiries/all');
export const updateEnquiry = (id, data) => API.put(`/content/enquiries/${id}`, data);
export const deleteEnquiry = (id) => API.delete(`/content/enquiries/${id}`);

export const fetchStats = () => API.get('/content/stats');
export const createStat = (data) => API.post('/content/stats', data);
export const updateStat = (id, data) => API.put(`/content/stats/${id}`, data);
export const deleteStat = (id) => API.delete(`/content/stats/${id}`);

export const fetchNotices = (admin = false) => API.get(admin ? '/content/notices/all' : '/content/notices');
export const createNotice = (data) => API.post('/content/notices', data);
export const updateNotice = (id, data) => API.put(`/content/notices/${id}`, data);
export const deleteNotice = (id) => API.delete(`/content/notices/${id}`);

export const fetchCourses = (admin = false) => API.get(admin ? '/content/courses/all' : '/content/courses');
export const createCourse = (data) => API.post('/content/courses', data);
export const updateCourse = (id, data) => API.put(`/content/courses/${id}`, data);
export const deleteCourse = (id) => API.delete(`/content/courses/${id}`);

export const fetchFaculty = (admin = false) => API.get(admin ? '/content/faculty/all' : '/content/faculty');
export const createFaculty = (data) => API.post('/content/faculty', data);
export const updateFaculty = (id, data) => API.put(`/content/faculty/${id}`, data);
export const deleteFaculty = (id) => API.delete(`/content/faculty/${id}`);

export const fetchGallery = (admin = false) => API.get(admin ? '/content/gallery/all' : '/content/gallery');
export const createGallery = (data) => API.post('/content/gallery', data);
export const updateGallery = (id, data) => API.put(`/content/gallery/${id}`, data);
export const deleteGallery = (id) => API.delete(`/content/gallery/${id}`);

export const fetchTestimonials = (admin = false) => API.get(admin ? '/content/testimonials/all' : '/content/testimonials');
export const createTestimonial = (data) => API.post('/content/testimonials', data);
export const updateTestimonial = (id, data) => API.put(`/content/testimonials/${id}`, data);
export const deleteTestimonial = (id) => API.delete(`/content/testimonials/${id}`);

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return API.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ==================== ACADEMIC APIs (Admin) ====================

// Student Management
export const createStudent = (data) => API.post('/academic/students', data);
export const fetchStudents = (batch) => API.get('/academic/students', { params: batch ? { batch } : {} });
export const fetchStudentDetail = (studentId) => API.get(`/academic/students/${studentId}`);
export const deleteStudent = (studentId) => API.delete(`/academic/students/${studentId}`);

// Test Management
export const createTest = (data) => API.post('/academic/tests', data);
export const fetchTests = (batch) => API.get('/academic/tests', { params: batch ? { batch } : {} });
export const fetchTestDetail = (testId) => API.get(`/academic/tests/${testId}`);
export const deleteTest = (testId) => API.delete(`/academic/tests/${testId}`);
export const togglePublishTest = (testId) => API.put(`/academic/tests/${testId}/publish`);

// Marks Entry (per test)
export const submitMarks = (testId, data) => API.post(`/academic/tests/${testId}/marks`, data);
export const submitMarksBulk = (testId, entries) => API.post(`/academic/tests/${testId}/marks/bulk`, { entries });

// Attendance (batch-wise)
export const recordBatchAttendance = (data) => API.post('/academic/attendance/batch', data);
export const fetchAttendanceByDate = (date, batch) => API.get(`/academic/attendance/date/${date}`, { params: batch ? { batch } : {} });
export const fetchStudentAttendanceAdmin = (studentId) => API.get(`/academic/attendance/student/${studentId}`);

// Analytics
export const fetchAnalytics = () => API.get('/academic/analytics');

// ==================== STUDENT APIs ====================

export const fetchStudentDashboard = () => AcademicAPI.get('/student/dashboard');
export const fetchStudentMarks = () => AcademicAPI.get('/student/marks');
export const fetchStudentAttendance = () => AcademicAPI.get('/student/attendance');
export const fetchStudentTests = () => AcademicAPI.get('/student/tests');

export default API;
