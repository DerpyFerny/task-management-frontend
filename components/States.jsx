import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/states`

export async function getStates() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getStateById(id) {
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data
}

export async function createState(state_name) {
    const response = await axios.post(baseUrl, { state_name })
    return response.data
}

export async function deleteState(id) {
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}
