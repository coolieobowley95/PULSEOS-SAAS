import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL

// Fail loudly at startup in production rather than silently hitting localhost
if (!BASE_URL && import.meta.env.PROD) {
  throw new Error(
    '[PulseOS] VITE_API_URL is not set. ' +
    'Add it to your production environment variables before building.'
  )
}

const api = axios.create({
  baseURL: BASE_URL || 'http://localhost:5000/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
