import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const baseUrl = `${API_BASE_URL}/projectmembers`

export async function getProjectMembers() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function createProjectMember(projectId, user_id, project_role, invited_by_user_id) {
    const payload = { user_id, project_role, invited_by_user_id }
    const response = await axios.post(`${baseUrl}/projects/${projectId}/members`, payload)
    return response.data
}

export async function deleteProjectMember(projectId, userId) {
    const response = await axios.delete(`${baseUrl}/projects/${projectId}/members/${userId}`)
    return response.data
}

export async function updateProjectMemberRole(projectId, userId, project_role) {
    const response = await axios.patch(`${baseUrl}/projects/${projectId}/members/${userId}`, {
        project_role,
    })
    return response.data
}
