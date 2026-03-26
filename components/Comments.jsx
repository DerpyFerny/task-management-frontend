import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/comments`

export async function getComments(){
    const response = await axios.get(baseUrl)
    return response.data
}


export async function getCommentsbyTask(id){
    const response = await axios.get(`${baseUrl}/tasks/${id}`)
    return response.data
}

export async function createComment(id, user_id, body, parent_comment_id){
    const newComment = {user_id, body, parent_comment_id}
    const response  = await axios.post(`${baseUrl}/tasks/${id}`, newComment)
    return response.data
}

export async function deleteCommentbyID(id){
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}
