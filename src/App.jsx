import { useCallback, useEffect, useState } from 'react'
import HomeSidebar from '../components/HomeSidebar.jsx'
import UserGrid from '../components/UserGrid.jsx'
import UserView from '../components/Userview.jsx'
import { createUser, deleteUser, getProjectbyUser, getUserbyID, getUsers } from '../components/User.jsx'
import { createState, getStates } from '../components/States.jsx'
import { createPriority, getPriorities } from '../components/Priorities.jsx'
import { createLabel, getLabels } from '../components/Labels.jsx'

export default function App() {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState(null)

  const [statesSeeded, setStatesSeeded] = useState(false)
  const [statesSeedError, setStatesSeedError] = useState(null)

  const [prioritiesSeeded, setPrioritiesSeeded] = useState(false)
  const [prioritiesSeedError, setPrioritiesSeedError] = useState(null)

  const [labelsSeeded, setLabelsSeeded] = useState(false)
  const [labelsSeedError, setLabelsSeedError] = useState(null)

  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState(null)

  const [showUserModal, setShowUserModal] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userSubmitting, setUserSubmitting] = useState(false)

  const loadUsers = useCallback(async () => {
    setUsersError(null)
    setUsersLoading(true)
    try {
      const data = await getUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setUsersError(e?.response?.data?.error || e?.message || 'Failed to load members')
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    let cancelled = false

    const normalize = (s) =>
      String(s || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')

    const ensureDefaultStates = async () => {
      setStatesSeedError(null)
      try {
        const required = ['Todo', 'In progress', 'Done']
        const existing = await getStates()
        const existingSet = new Set((Array.isArray(existing) ? existing : []).map((s) => normalize(s.state_name)))

        const missing = required.filter((name) => !existingSet.has(normalize(name)))
        for (const name of missing) {
          await createState(name)
        }
      } catch (e) {
        if (!cancelled) {
          setStatesSeedError(e?.response?.data?.error || e?.message || 'Could not seed workflow states')
        }
      } finally {
        if (!cancelled) setStatesSeeded(true)
      }
    }

    ensureDefaultStates()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const normalize = (s) =>
      String(s || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')

    const ensureDefaultLabels = async () => {
      setLabelsSeedError(null)
      try {
        // Priority-driven labels
        const required = [
          { name: 'High', color: '#ef4444' }, // red
          { name: 'Medium', color: '#3b82f6' }, // blue
          { name: 'Low', color: '#6b6b6b' }, // gray
        ]

        const existing = await getLabels()
        const existingSet = new Set(
          (Array.isArray(existing) ? existing : []).map((l) => normalize(l.name)),
        )

        const missing = required.filter((l) => !existingSet.has(normalize(l.name)))
        for (const l of missing) {
          await createLabel(l.name, l.color)
        }
      } catch (e) {
        if (!cancelled) {
          setLabelsSeedError(e?.response?.data?.error || e?.message || 'Could not seed labels')
        }
      } finally {
        if (!cancelled) setLabelsSeeded(true)
      }
    }

    ensureDefaultLabels()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const normalize = (s) =>
      String(s || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')

    const ensureDefaultPriorities = async () => {
      setPrioritiesSeedError(null)
      try {
        const required = [
          { name: 'High', sort_order: 3 },
          { name: 'Medium', sort_order: 2 },
          { name: 'Low', sort_order: 1 },
        ]

        const existing = await getPriorities()
        const existingSet = new Set((Array.isArray(existing) ? existing : []).map((p) => normalize(p.priority_name)))

        const missing = required.filter((p) => !existingSet.has(normalize(p.name)))
        for (const p of missing) {
          await createPriority(p.name, p.sort_order)
        }
      } catch (e) {
        if (!cancelled) {
          setPrioritiesSeedError(e?.response?.data?.error || e?.message || 'Could not seed priorities')
        }
      } finally {
        if (!cancelled) setPrioritiesSeeded(true)
      }
    }

    ensureDefaultPriorities()
    return () => {
      cancelled = true
    }
  }, [])

  const loadUserAndProjects = useCallback(async (userId) => {
    if (!userId) {
      setSelectedUser(null)
      setProjects([])
      return
    }
    setProjectsError(null)
    setProjectsLoading(true)
    try {
      const [u, projs] = await Promise.all([getUserbyID(userId), getProjectbyUser(userId)])
      setSelectedUser(u)
      setProjects(Array.isArray(projs) ? projs : [])
    } catch (e) {
      setProjectsError(e?.response?.data?.error || e?.message || 'Failed to load projects')
      setSelectedUser(null)
      setProjects([])
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedUserId) loadUserAndProjects(selectedUserId)
    else {
      setSelectedUser(null)
      setProjects([])
    }
  }, [selectedUserId, loadUserAndProjects])

  const handleGoAllUsers = () => setSelectedUserId(null)

  const handleSelectUser = (id) => setSelectedUserId(id)

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await deleteUser(id)
      if (selectedUserId === id) setSelectedUserId(null)
      await loadUsers()
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Could not delete member')
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password) return
    setUserSubmitting(true)
    try {
      await createUser(username.trim(), email.trim(), password)
      setUsername('')
      setEmail('')
      setPassword('')
      setShowUserModal(false)
      await loadUsers()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Could not create member')
    } finally {
      setUserSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <HomeSidebar
        users={users}
        loading={usersLoading}
        selectedUserId={selectedUserId}
        onSelectUser={handleSelectUser}
        onDeleteUser={handleDeleteUser}
        onOpenCreateUser={() => setShowUserModal(true)}
        onGoAllUsers={handleGoAllUsers}
      />

      <main className="app-main">
        {usersError ? (
          <div className="error-banner" role="alert">
            {usersError}
          </div>
        ) : null}

        {statesSeedError ? (
          <div className="error-banner" role="alert">
            {statesSeedError}
          </div>
        ) : null}

        {prioritiesSeedError ? (
          <div className="error-banner" role="alert">
            {prioritiesSeedError}
          </div>
        ) : null}

        {labelsSeedError ? (
          <div className="error-banner" role="alert">
            {labelsSeedError}
          </div>
        ) : null}

        {!selectedUserId ? (
          <div className="home-wrap">
            <h1 className="home-title">Users</h1>
            <UserGrid
              users={users}
              loading={usersLoading}
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        ) : (
          !statesSeeded || !prioritiesSeeded || !labelsSeeded ? (
            <div className="home-wrap">
              <h1 className="home-title">Loading workflow…</h1>
            </div>
          ) : (
          <UserView
            user={selectedUser}
            users={users}
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            onRefreshProjects={() => loadUserAndProjects(selectedUserId)}
          />
          )
        )}
      </main>

      {showUserModal ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUserModal(false)
          }}
        >
          <div className="modal-panel" role="dialog" aria-labelledby="modal-new-member-title">
            <div className="modal-header">
              <h2 id="modal-new-member-title" className="modal-title">
                New user
              </h2>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="field">
                  <label className="field-label" htmlFor="modal-username">
                    Username
                  </label>
                  <input
                    id="modal-username"
                    className="field-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Username"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="modal-email">
                    Email
                  </label>
                  <input
                    id="modal-email"
                    className="field-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="modal-password">
                    Password
                  </label>
                  <input
                    id="modal-password"
                    className="field-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={userSubmitting || !username.trim() || !email.trim() || !password}
                >
                  {userSubmitting ? 'Adding…' : 'Add user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
