import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api' || import.meta.env.VITE_API_URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth services
export const authService = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }).then(res => res.data),
  
  getCurrentUser: () => 
    api.get('/auth/me').then(res => res.data),
}

// Item services
export const itemService = {
  getItems: (params = {}) => 
    api.get('/items/', { params }).then(res => res.data),
  
  getItem: (id) => 
    api.get(`/items/${id}`).then(res => res.data),
  
  createItem: (formData) => 
    api.post('/items/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  updateItem: (id, formData) => 
    api.put(`/items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  deleteItem: (id) => 
    api.delete(`/items/${id}`).then(res => res.data),
}

// Category services
export const categoryService = {
  getCategories: () => 
    api.get('/categories/').then(res => res.data),
  
  createCategory: (data) => 
    api.post('/categories/', data).then(res => res.data),
  
  updateCategory: (id, data) => 
    api.put(`/categories/${id}`, data).then(res => res.data),
  
  deleteCategory: (id) => 
    api.delete(`/categories/${id}`).then(res => res.data),
}

// Borrow services
export const borrowService = {
  getBorrowLogs: (params = {}) => 
    api.get('/borrowed/', { params }).then(res => res.data),
  
  getBorrowLog: (id) => 
    api.get(`/borrowed/${id}`).then(res => res.data),
  
  createBorrowLog: (data) => 
    api.post('/borrowed/', data).then(res => res.data),
  
  updateBorrowLog: (id, data) => 
    api.put(`/borrowed/${id}`, data).then(res => res.data),
  
  returnItem: (id, notes) => 
    api.post(`/borrowed/${id}/return`, { notes }).then(res => res.data),
  
  deleteBorrowLog: (id) => 
    api.delete(`/borrowed/${id}`).then(res => res.data),
}

// User services
export const userService = {
  getUsers: () => 
    api.get('/users/').then(res => res.data),
  
  createUser: (data) => 
    api.post('/users/', data).then(res => res.data),
  
  updateUser: (id, data) => 
    api.put(`/users/${id}`, data).then(res => res.data),
  
  // ADD DELETE FUNCTION
  deleteUser: (id) => 
    api.delete(`/users/${id}`).then(res => res.data),
}

// Dashboard services
export const dashboardService = {
  getStats: () => 
    api.get('/users/dashboard/stats').then(res => res.data),
}

// Profile services
export const profileService = {
  getMyProfile: () => 
    api.get('/profile/me').then(res => res.data),
  
  updateMyProfile: (data) => 
    api.put('/profile/me', data).then(res => res.data),
  
  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/profile/me/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
  },
  
  // Admin-only services
  getUserProfile: (userId) => 
    api.get(`/profile/${userId}`).then(res => res.data),
  
  updateUserProfile: (userId, data) => 
    api.put(`/profile/${userId}/profile`, data).then(res => res.data),
  
  uploadUserProfilePicture: (userId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/profile/${userId}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data)
  }
}
export default api