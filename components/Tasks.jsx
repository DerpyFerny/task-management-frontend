import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/tasks`

export async function getTasks() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getTaskById(id) {
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data
}

export async function createTask(sprint_id, task_name, state_id, priority_id, description, due_date) {
    const newTask = { sprint_id, task_name, state_id, priority_id, description, due_date }
    const response = await axios.post(baseUrl, newTask)
    return response.data
}

export async function deleteTask(id) {
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}

export async function updateTask(id, patch) {
    const response = await axios.patch(`${baseUrl}/${id}`, patch)
    return response.data
}
