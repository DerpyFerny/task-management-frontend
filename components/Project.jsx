import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://task-management-backend-ndng.onrender.com'
const baseUrl = `${API_BASE_URL}/projects`


export async function getProjects(){
    const response = await axios.get(baseUrl)
    return response.data

}

export async function getProjectsbyID(id){
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data
}

export async function getProjectMember(id){
    const response = await axios.get(`${baseUrl}/${id}/members`)
    return response.data
}

export async function getProjectTask(id){
    const response = await axios.get(`${baseUrl}/${id}/tasks`)
    return response.data
}


export async function getProjectTaskbySprint(id){
    const response = await axios.get(`${baseUrl}/${id}/tasks/by-sprint`)
    return response.data
}


export async function getProjectSprint(id){
    const response = await axios.get(`${baseUrl}/${id}/sprints`)
    return response.data
}


export async function getProjectSprintbyID(id1,id2){
    const response = await axios.get(`${baseUrl}/${id1}/sprints/${id2}`)
    return response.data
}



export async function createProject(project_name, description, start_date, end_date){
    const new_project = { project_name, description, start_date, end_date }
    const response = await axios.post(baseUrl, new_project)
    return response.data

}


export async function deleteProject(id){
    const response = await axios.delete(`${baseUrl}/${id}`)
    return response.data
}

/** Create project and add user as OWNER (for “new project for this user”). */
export async function createProjectForUser(userId, project_name, description, start_date, end_date) {
    const project = await createProject(project_name, description, start_date, end_date)
    const memberUrl = `${API_BASE_URL}/projectmembers/projects/${project.project_id}/members`
    await axios.post(memberUrl, {
        user_id: userId,
        project_role: 'OWNER',
        invited_by_user_id: null,
    })
    return { ...project, project_role: 'OWNER' }
}

