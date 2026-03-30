import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://task-management-backend-ndng.onrender.com'
const baseUrl = `${API_BASE_URL}/notifications`

export async function getNotifications() {
    const response = await axios.get(baseUrl)
    return response.data
}

export async function getNotificationsByUser(userId, is_read) {
    const params = {}
    if (is_read !== undefined && is_read !== null) {
        params.is_read = is_read
    }
    const response = await axios.get(`${baseUrl}/users/${userId}`, { params })
    return response.data
}

export async function markNotificationAsRead(notificationId) {
    const response = await axios.patch(`${baseUrl}/${notificationId}/read`)
    return response.data
}

export async function deleteNotification(notificationId) {
    const response = await axios.delete(`${baseUrl}/${notificationId}`)
    return response.data
}
