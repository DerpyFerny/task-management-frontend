import axios from 'axios'
// Vite env var: set VITE_API_BASE_URL in frontend/.env (e.g. "https://monsterasp.net")

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://task-management-backend-ndng.onrender.com'
const baseUrl = `${API_BASE_URL}/assignments`

export async function getAssignments(){
    const response = await axios.get(baseUrl)
    return response.data
}


export async function getAssignmentsbyTask(id){
    const response = await axios.get(`${baseUrl}/tasks/${id}`)
    return response.data
}

export async function createAssignment(id, user_id, role_in_task, status ){
    const newAssignment = {user_id, role_in_task, status}
    const response = await axios.post(`${baseUrl}/tasks/${id}`, newAssignment)
    return response.data
}


export async function deleteAssignment(id1,id2){
    const response = await axios.delete(`${baseUrl}/tasks/${id1}/users/${id2}`)
    return response.data
}