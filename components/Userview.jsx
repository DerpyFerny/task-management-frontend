import { useState } from 'react'
import { createProjectForUser, deleteProject } from './Project.jsx'
import ProjectView from './ProjectView.jsx'

function formatDateIso(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return String(v).slice(0, 10)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return '—'
  }
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
    </svg>
  )
}

export default function UserView({
  user,
  users = [],
  projects,
  loading,
  error,
  onRefreshProjects,
}) {
  const [openedProjectId, setOpenedProjectId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setSubmitting(true)
    try {
      await createProjectForUser(
        user.user_id,
        name.trim(),
        description.trim() || null,
        startDate || null,
        endDate || null,
      )
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setShowCreate(false)
      await onRefreshProjects()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project?')) return
    await deleteProject(projectId)
    await onRefreshProjects()
  }

  if (!user) {
    return (
      <div className="pv-wrap">
        {loading ? (
          <div className="project-card" style={{ padding: 24 }}>
            <div className="loading-line" style={{ width: '40%' }} />
            <div className="loading-line" style={{ width: '70%', marginTop: 16 }} />
          </div>
        ) : error ? (
          <div className="error-banner" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    )
  }

  if (openedProjectId != null) {
    return (
      <ProjectView
        projectId={openedProjectId}
        workspaceUser={user}
        allUsers={users}
        onBack={() => setOpenedProjectId(null)}
        onRefreshProjects={onRefreshProjects}
      />
    )
  }

  return (
    <div className="pv-wrap pv-wrap--enter">
      <nav className="pv-breadcrumb" aria-label="Breadcrumb">
        <span className="pv-breadcrumb-user">{user.username}</span>
        <span className="pv-breadcrumb-sep">/</span>
        <span className="pv-breadcrumb-page">Projects</span>
      </nav>

      <div className="pv-head">
        <h1 className="pv-title">Projects</h1>
        <button
          type="button"
          className={`btn-new-project${showCreate ? ' is-active' : ''}`}
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? 'Close' : (
            <>
              <PlusIcon /> New project
            </>
          )}
        </button>
      </div>

      {error ? (
        <div className="error-banner" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {showCreate ? (
        <form className="pv-create-panel pv-create-panel--enter" onSubmit={handleCreate}>
          <div className="pv-create-grid">
            <div className="field field-full">
              <label className="field-label" htmlFor="proj-name">
                Name
              </label>
              <input
                id="proj-name"
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website"
                required
              />
            </div>
            <div className="field field-full">
              <label className="field-label" htmlFor="proj-desc">
                Description
              </label>
              <input
                id="proj-desc"
                className="field-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="proj-start">
                Start
              </label>
              <input
                id="proj-start"
                className="field-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="proj-end">
                End
              </label>
              <input
                id="proj-end"
                className="field-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="pv-create-actions">
            <button type="button" className="btn-cancel" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="project-card-grid">
          <div className="project-card">
            <div className="loading-line" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div className="loading-line" style={{ width: '50%', marginTop: 14 }} />
            <div className="loading-line" style={{ width: '80%', marginTop: 10 }} />
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-inline">No projects yet — create one above.</div>
      ) : (
        <div className="project-card-grid project-card-grid--stagger">
          {projects.map((p, index) => (
            <article
              key={p.project_id}
              className="project-card"
              style={{ '--stagger': index }}
            >
              <div className="project-card-glow" aria-hidden />
              <div className="project-card-icon" aria-hidden>
                <BuildingIcon />
              </div>
              <h2 className="project-card-name">{p.project_name}</h2>
              <p className="project-card-desc">{p.description || '\u00a0'}</p>
              <p className="project-card-dates">
                <span className="project-card-dates-start">
                  {formatDateIso(p.start_date)}
                </span>
                <span className="project-card-dates-sep">→</span>
                <span>{formatDateIso(p.end_date)}</span>
              </p>
              <div className="project-card-footer">
                <button
                  type="button"
                  className="project-card-link"
                  onClick={() => setOpenedProjectId(p.project_id)}
                >
                  Open project
                  <span className="project-card-link-chevron" aria-hidden>
                    ›
                  </span>
                </button>
                <button
                  type="button"
                  className="project-card-delete"
                  title="Delete project"
                  aria-label={`Delete ${p.project_name}`}
                  onClick={() => handleDeleteProject(p.project_id)}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                    <path d="M6 2V1h4v1h3v1H3V2h3zM4 5v8a2 2 0 002 2h4a2 2 0 002-2V5H4zm2 2h1v5H6V7zm3 0h1v5H9V7z" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
