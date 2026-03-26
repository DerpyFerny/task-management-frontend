import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/labels`

export async function getLabels() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function createLabel(name, color) {
    const response = await axios.post(baseUrl, { name, color })
    return response.data
}

export async function deleteLabel(labelId) {
    const response = await axios.delete(`${baseUrl}/${labelId}`)
    return response.data
}
