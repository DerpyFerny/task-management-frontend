import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://task-management-backend-ndng.onrender.com'
const baseUrl = `${API_BASE_URL}/priorities`

export async function getPriorities() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getPriorityById(id) {
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data
}

export async function createPriority(priority_name, sort_order) {
    const response = await axios.post(baseUrl, { priority_name, sort_order })
    return response.data
}

export async function deletePriority(id) {
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}
