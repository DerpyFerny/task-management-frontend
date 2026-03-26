import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/steps`

export async function getSteps() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getStepsByTask(taskId) {
    const response = await axios.get(`${baseUrl}/tasks/${taskId}`)
    return response.data
}

export async function createStep(taskId, step_no, step_description, is_done) {
    const newStep = { step_no, step_description, is_done }
    const response = await axios.post(`${baseUrl}/tasks/${taskId}`, newStep)
    return response.data
}

export async function updateStep(taskId, stepNo, payload) {
    const response = await axios.patch(`${baseUrl}/tasks/${taskId}/${stepNo}`, payload)
    return response.data
}

export async function deleteStep(taskId, stepNo) {
    const response = await axios.delete(`${baseUrl}/tasks/${taskId}/${stepNo}`)
    return response.data
}
