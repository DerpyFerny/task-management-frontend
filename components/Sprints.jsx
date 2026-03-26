import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/sprints`

export async function getSprints() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getSprintById(id) {
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data
}

export async function createSprint(project_id, sprint_name, start_date, end_date, goal) {
    const newSprint = { project_id, sprint_name, start_date, end_date, goal }
    const response = await axios.post(baseUrl, newSprint)
    return response.data
}

export async function getSprintTasks(id) {
    const response = await axios.get(`${baseUrl}/${id}/tasks`)
    return response.data
}

export async function deleteSprint(id) {
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}
