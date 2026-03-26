import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/tasklabels`

export async function getTaskLabels() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getTaskLabelsByTask(taskId) {
    const response = await axios.get(`${baseUrl}/tasks/${taskId}`)
    return response.data
}

export async function createTaskLabel(taskId, label_id) {
    const response = await axios.post(`${baseUrl}/tasks/${taskId}`, { label_id })
    return response.data
}

export async function deleteTaskLabel(taskId, labelId) {
    const response = await axios.delete(`${baseUrl}/tasks/${taskId}/labels/${labelId}`)
    return response.data
}
