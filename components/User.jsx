import axios from 'axios'
// Vite env var: set VITE_API_BASE_URL in frontend/.env (e.g. "https://monsterasp.net")
// Fallback to local dev.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://task-management-backend-ndng.onrender.com'
const baseUrl = `${API_BASE_URL}/users`

export async function getUsers(){
    const response = await axios.get(baseUrl)
    return response.data
   
}
export async function getUserbyID(id){
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data
}

export async function getProjectbyUser(id){
    const response = await axios.get(`${baseUrl}/${id}/projects`)
    return response.data
}

export async function createUser(username, email, password){
    const new_user = { username, email, password }
    const response = await axios.post(baseUrl, new_user)
    return response.data
}

export async function deleteUser(id){
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}