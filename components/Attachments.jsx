import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/attachments`

export async function getAttachments(){
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getAttachmentsbyTask(id){
    const response = await axios.get(`${baseUrl}/tasks/${id}`)
    return response.data
}

export async function uploadAttachment(taskId, file, uploaded_by_user_id){
    const formData = new FormData()
    formData.append('file', file)
    if (uploaded_by_user_id !== undefined && uploaded_by_user_id !== null) {
        formData.append('uploaded_by_user_id', uploaded_by_user_id)
    }

    const response = await axios.post(`${baseUrl}/tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
}

export async function deleteAttachments(id){
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}