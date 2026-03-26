import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createProjectMember,
  deleteProjectMember,
  updateProjectMemberRole,
} from './ProjectMembers.jsx'
import {
  getProjectMember,
  getProjectsbyID,
  getProjectSprint,
  getProjectTask,
} from './Project.jsx'
import { createSprint, deleteSprint } from './Sprints.jsx'
import { createTask, deleteTask, updateTask } from './Tasks.jsx'
import { createTaskLabel } from './Tasklabels.jsx'
import { getLabels } from './Labels.jsx'
import { getPriorities } from './Priorities.jsx'
import { getStates } from './States.jsx'
import { createAssignment, deleteAssignment } from './Assignments.jsx'
const coverUrl = '/nasa-cover.jpg'

const ROLES = ['OWNER', 'CONTRIBUTOR', 'MAINTAINER']
const TASK_ASSIGN_ROLES = ['Implementer', 'Reviewer', 'Coordinator']

function normalizeProjectRole(role) {
  if (ROLES.includes(role)) return role
  return 'CONTRIBUTOR'
}


function normalizeTaskRow(row) {
  const labels = Array.isArray(row.labels) ? row.labels : []
  const assignments = Array.isArray(row.assignments) ? row.assignments : []
  return {
    ...row,
    task_id: Number(row.task_id),
    sprint_id: row.sprint_id != null ? Number(row.sprint_id) : null,
    state_id: row.state_id != null ? Number(row.state_id) : null,
    priority_id: row.priority_id != null ? Number(row.priority_id) : null,
    labels,
    assignments,
  }
}


function matchStateToBoardColumn(stateName) {
  const n = (stateName || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
  if (!n) return null
  if (n === 'done' || n === 'completed') return 'done'
  if (n.includes('progress') || n === 'inprogress' || n === 'doing') return 'in_progress'
  if (n === 'todo' || n === 'to do' || n === 'to-do' || n === 'pending' || n === 'backlog') return 'todo'
  return null
}


function resolveBoardStateIds(states) {
  const map = { todo: null, in_progress: null, done: null }
  const list = Array.isArray(states) ? [...states] : []
  for (const s of list) {
    const stateId = Number(s.state_id)
    if (!Number.isFinite(stateId) || stateId <= 0) continue
    const key = matchStateToBoardColumn(s.state_name)
    if (key && map[key] == null) map[key] = stateId
  }
  const sorted = list
    .map((s) => Number(s.state_id))
    .filter((id) => Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b)
  if (sorted.length >= 3) {
    if (map.todo == null) map.todo = sorted[0].state_id
    if (map.in_progress == null) map.in_progress = sorted[1].state_id
    if (map.done == null) map.done = sorted[2].state_id
  }
  return map
}

function getTaskBoardColumn(task, boardIds) {
  const sid = task.state_id
  if (sid != null && boardIds.todo != null && Number(sid) === Number(boardIds.todo)) return 'todo'
  if (sid != null && boardIds.in_progress != null && Number(sid) === Number(boardIds.in_progress))
    return 'in_progress'
  if (sid != null && boardIds.done != null && Number(sid) === Number(boardIds.done)) return 'done'
  return 'todo'
}

function toPositiveInt(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

const BOARD_COLUMNS = [
  { key: 'todo', label: 'TODO', variant: 'todo' },
  { key: 'in_progress', label: 'IN PROGRESS', variant: 'progress' },
  { key: 'done', label: 'DONE', variant: 'done' },
]

function formatDateShort(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="notion-doc-icon">
      <path d="M3 0h7l4 4v11a2 2 0 01-2 2H3a2 2 0 01-2-2V2a2 2 0 012-2zm0 2v12h8V5H8V2H3zm6 .6L12.4 4H9V2.6z" />
    </svg>
  )
}

function LabelPill({ name, color }) {
  const raw = (color || '#6b6b6b').replace(/^#/, '')
  const hex = `#${raw}`
  return (
    <span
      className="label-dot"
      style={{
        background: hex,
        borderColor: hex,
      }}
      title={name}
      aria-label={name}
    >
      {/* Color dot only (text shown via tooltip) */}
    </span>
  )
}

export default function ProjectView({
  projectId,
  workspaceUser,
  allUsers,
  onBack,
  onRefreshProjects,
}) {
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [sprints, setSprints] = useState([])
  const [states, setStates] = useState([])
  const [priorities, setPriorities] = useState([])
  const [labelCatalog, setLabelCatalog] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole] = useState('CONTRIBUTOR')
  const [addingMember, setAddingMember] = useState(false)

  const [selectedSprintId, setSelectedSprintId] = useState(null)
  const [showNewSprint, setShowNewSprint] = useState(false)
  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintStart, setNewSprintStart] = useState('')
  const [newSprintEnd, setNewSprintEnd] = useState('')
  const [creatingSprint, setCreatingSprint] = useState(false)

  const [taskModal, setTaskModal] = useState(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)

  const [dragTaskId, setDragTaskId] = useState(null)

  /** task_id -> user_id string for "add assignee" row */
  const [assignUserPick, setAssignUserPick] = useState({})
  const [assignRolePick, setAssignRolePick] = useState({})

  const labelIdByKey = useMemo(() => {
    const map = {}
    for (const lb of labelCatalog || []) {
      const key = String(lb.name || '').toLowerCase().trim()
      if (!key) continue
      map[key] = lb.label_id
    }
    return map
  }, [labelCatalog])

  const getAutoLabelIdsForPriorityId = useCallback(
    (priorityId) => {
      if (priorityId == null) return []
      const pri = (priorities || []).find((p) => Number(p.priority_id) === Number(priorityId))
      if (!pri) return []
      const key = String(pri.priority_name || '').toLowerCase().trim()
      const labelId = labelIdByKey[key]
      return labelId ? [labelId] : []
    },
    [priorities, labelIdByKey],
  )

  const loadData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [p, m, t, sp, st, pr, lb] = await Promise.all([
        getProjectsbyID(projectId),
        getProjectMember(projectId),
        getProjectTask(projectId),
        getProjectSprint(projectId).catch(() => []),
        getStates(),
        getPriorities(),
        getLabels(),
      ])
      setProject(p)
      setMembers(Array.isArray(m) ? m : [])
      setTasks((Array.isArray(t) ? t : []).map(normalizeTaskRow))
      const sprintList = Array.isArray(sp) ? sp : []
      setSprints(sprintList.sort((a, b) => (a.sprint_id || 0) - (b.sprint_id || 0)))
      setStates(Array.isArray(st) ? st.sort((a, b) => (a.state_id || 0) - (b.state_id || 0)) : [])
      setPriorities(Array.isArray(pr) ? pr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : [])
      setLabelCatalog(Array.isArray(lb) ? lb : [])

      setSelectedSprintId((prev) => {
        if (sprintList.length === 0) return null
        if (prev && sprintList.some((s) => s.sprint_id === prev)) return prev
        return sprintList[0].sprint_id
      })
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load project')
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const memberUserIds = useMemo(() => new Set(members.map((m) => m.user_id)), [members])

  const inviteOptions = useMemo(
    () => (allUsers || []).filter((u) => !memberUserIds.has(u.user_id)),
    [allUsers, memberUserIds],
  )

  const assignableForTask = useCallback(
    (task) => {
 
      const taken = new Set(
        (task.assignments || [])
          .filter((a) => (a.status ?? 'ACTIVE') === 'ACTIVE')
          .map((a) => a.user_id),
      )
      return members.filter((m) => !taken.has(m.user_id))
    },
    [members],
  )

  const tasksForSprint = useMemo(() => {
    if (selectedSprintId == null) return []
    return tasks.filter((t) => Number(t.sprint_id) === Number(selectedSprintId))
  }, [tasks, selectedSprintId])

  const boardStateIds = useMemo(() => resolveBoardStateIds(states), [states])

  /** Ordered Todo → In progress → Done for table dropdowns */
  const boardStateOptions = useMemo(() => {
    const ids = boardStateIds
    const order = ['todo', 'in_progress', 'done']
    return order
      .map((k) => (states || []).find((s) => Number(s.state_id) === Number(ids[k])))
      .filter(Boolean)
  }, [states, boardStateIds])

  const openNewTask = (defaults = {}) => {
    const firstPri = priorities[0]
    const priId = firstPri?.priority_id ?? null
    setTaskModal({
      task_name: '',
      description: '',
      sprint_id: defaults.sprint_id ?? selectedSprintId ?? sprints[0]?.sprint_id ?? null,
      lock_sprint: Boolean(defaults.lock_sprint),
      selectedLabelIds: getAutoLabelIdsForPriorityId(priId),
      state_id:
        defaults.state_id ??
        boardStateIds.todo ??
        (states?.[0] != null ? Number(states[0].state_id) : null) ??
        null,
      priority_id: priId,
      due_date: '',
      ...defaults,
    })
  }

  const submitNewTask = async (e) => {
    e.preventDefault()
    if (!taskModal?.task_name?.trim() || !taskModal.sprint_id) return
    setTaskSubmitting(true)
    try {
      const created = await createTask(
        taskModal.sprint_id,
        taskModal.task_name.trim(),
        taskModal.state_id,
        taskModal.priority_id,
        taskModal.description?.trim() || null,
        taskModal.due_date || null,
      )
      const selected = Array.isArray(taskModal.selectedLabelIds) ? taskModal.selectedLabelIds : []
      if (selected.length) {
        const taskId = created?.task_id ?? created?.taskId
        if (taskId != null) {
          await Promise.all(selected.map((labelId) => createTaskLabel(taskId, labelId)))
        }
      }
      setTaskModal(null)
      await loadData()
      onRefreshProjects?.()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Could not create task')
    } finally {
      setTaskSubmitting(false)
    }
  }

  const patchTaskField = async (taskId, patch) => {
    try {
      await updateTask(taskId, patch)
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Update failed')
    }
  }

  const handleAddAssignee = async (task) => {
    const uid = assignUserPick[task.task_id]
    const role = assignRolePick[task.task_id] || TASK_ASSIGN_ROLES[0]
    if (!uid) return
    try {
      await createAssignment(task.task_id, Number(uid), role, 'ACTIVE')
      setAssignUserPick((p) => ({ ...p, [task.task_id]: '' }))
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Could not assign')
    }
  }

  const handleRemoveAssignee = async (taskId, userId) => {
    try {
      await deleteAssignment(taskId, userId)
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Could not remove assignee')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!addUserId) return
    setAddingMember(true)
    try {
      await createProjectMember(projectId, Number(addUserId), addRole, workspaceUser?.user_id ?? null)
      setAddUserId('')
      setAddRole('CONTRIBUTOR')
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Could not add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleCreateSprint = async (e) => {
    e.preventDefault()
    if (!newSprintName.trim()) return
    setCreatingSprint(true)
    try {
      const sp = await createSprint(
        projectId,
        newSprintName.trim(),
        newSprintStart || null,
        newSprintEnd || null,
        null,
      )
      setShowNewSprint(false)
      setNewSprintName('')
      setNewSprintStart('')
      setNewSprintEnd('')
      await loadData()
      setSelectedSprintId(sp.sprint_id)
      onRefreshProjects?.()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Could not create sprint')
    } finally {
      setCreatingSprint(false)
    }
  }

  const handleMoveTask = async (taskIdInput, stateIdInput) => {
    const taskId = toPositiveInt(taskIdInput)
    const stateId = toPositiveInt(stateIdInput)
    if (taskId == null || stateId == null) {
      setDragTaskId(null)
      return
    }
    try {
      await updateTask(taskId, { state_id: stateId })
      setDragTaskId(null)
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Could not move task')
    }
  }

  if (loading && !project) {
    return (
      <div className="project-page">
        <div className="project-page-inner">
          <div className="loading-line" style={{ width: '40%', height: 14 }} />
          <div className="loading-line" style={{ width: '60%', marginTop: 20 }} />
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="project-page">
        <div className="project-page-inner">
          <button type="button" className="notion-back" onClick={onBack}>
            ← Back
          </button>
          <div className="error-banner" role="alert" style={{ marginTop: 16 }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="project-page">
      <div className="project-cover-wrap">
        <img className="project-cover" src={coverUrl} alt="" />
      </div>

      <div className="project-page-inner">
        <nav className="project-breadcrumb notion-breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="notion-back" onClick={onBack}>
            ← Back to projects
          </button>
          <span className="notion-bc-sep">/</span>
          <span>{workspaceUser?.username}</span>
          <span className="notion-bc-sep">/</span>
          <span className="notion-bc-current">{project?.project_name}</span>
        </nav>

        <header className="project-header">
          <h1 className="project-title">{project?.project_name}</h1>
          {project?.description ? <p className="project-desc">{project.description}</p> : null}
          <div className="project-meta">
            <span>{formatDateShort(project?.start_date)}</span>
            <span className="project-meta-sep">→</span>
            <span>{formatDateShort(project?.end_date)}</span>
          </div>
        </header>

        <section className="notion-block">
          <h2 className="notion-h2">Team members:</h2>
          <ul className="notion-member-list">
            {members.map((m) => (
              <li key={m.user_id} className="notion-member-row">
                <span className="notion-member-name">{m.username}</span>
                <select
                  className="notion-select notion-select--sm"
                  value={normalizeProjectRole(m.project_role)}
                  onChange={(e) =>
                    updateProjectMemberRole(projectId, m.user_id, e.target.value)
                      .then(loadData)
                      .catch((err) => alert(err?.response?.data?.error || err?.message || 'Could not update role'))
                  }
                  aria-label={`Role for ${m.username}`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="notion-icon-btn"
                  title="Remove member"
                  onClick={async () => {
                    if (!window.confirm(`Remove ${m.username} from this project?`)) return
                    try {
                      await deleteProjectMember(projectId, m.user_id)
                      await loadData()
                    } catch (err) {
                      alert(err?.response?.data?.error || err?.message || 'Remove failed')
                    }
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <form className="notion-add-member" onSubmit={handleAddMember}>
            <select
              className="notion-select"
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              aria-label="User to add"
            >
              <option value="">Add people…</option>
              {inviteOptions.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.username} ({u.email})
                </option>
              ))}
            </select>
            <select
              className="notion-select"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
              aria-label="Role"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button type="submit" className="notion-btn notion-btn--blue" disabled={!addUserId || addingMember}>
              {addingMember ? 'Adding…' : 'Add'}
            </button>
          </form>
        </section>

        <section className="notion-block notion-database">
          <div className="notion-db-head">
            <h2 className="notion-h2">Tasks</h2>
            <div className="notion-db-toolbar">
              <button type="button" className="notion-btn notion-btn--blue" onClick={() => openNewTask()}>
                New
              </button>
            </div>
          </div>
          <div className="notion-table-wrap">
            <table className="notion-table">
              <thead>
                <tr>
                  <th className="col-task">
                    <span className="notion-col-icon">Aa</span> Task
                  </th>
                  <th>Sprint</th>
                  <th>State</th>
                  <th>Priority</th>
                  <th>Assignment</th>
                  <th>Labels</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="notion-table-empty">
                      No tasks yet. Create a sprint below, then add tasks.
                    </td>
                  </tr>
                ) : (
                  tasks.map((row) => (
                    <tr key={row.task_id} className="notion-table-row">
                      <td>
                        <span className="notion-cell-title">
                          <DocIcon />
                          <span>{row.task_name}</span>
                        </span>
                      </td>
                      <td>
                        <select
                          className="notion-select notion-select--table"
                          value={row.sprint_id != null ? String(row.sprint_id) : ''}
                          onChange={(e) => patchTaskField(row.task_id, { sprint_id: Number(e.target.value) })}
                        >
                          {sprints.map((s) => (
                            <option key={s.sprint_id} value={String(s.sprint_id)}>
                              {s.sprint_name || `Sprint ${s.sprint_id}`}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="notion-select notion-select--table"
                          value={row.state_id != null ? String(row.state_id) : ''}
                          onChange={(e) =>
                            patchTaskField(row.task_id, {
                              state_id: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                        >
                          <option value="">—</option>
                          {boardStateOptions.map((s) => (
                            <option key={s.state_id} value={String(s.state_id)}>
                              {s.state_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="notion-select notion-select--table"
                          value={row.priority_id != null ? String(row.priority_id) : ''}
                          onChange={(e) =>
                            patchTaskField(row.task_id, {
                              priority_id: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                        >
                          <option value="">—</option>
                          {priorities.map((p) => (
                            <option key={p.priority_id} value={String(p.priority_id)}>
                              {p.priority_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="notion-assign-cell">
                          <div className="notion-assign-chips">
                            {(row.assignments || [])
                              .filter((a) => (a.status ?? 'ACTIVE') === 'ACTIVE')
                              .map((a) => (
                                <span key={a.user_id} className="notion-assign-chip">
                                <span className="notion-assign-chip-text">
                                  {a.username}
                                  <span className="notion-assign-role"> · {a.role_in_task}</span>
                                </span>
                                <button
                                  type="button"
                                  className="notion-assign-chip-remove"
                                  title="Remove assignment"
                                  aria-label={`Unassign ${a.username}`}
                                  onClick={() => handleRemoveAssignee(row.task_id, a.user_id)}
                                >
                                  ×
                                </button>
                                </span>
                              ))}
                          </div>
                          <div className="notion-assign-add">
                            <select
                              className="notion-select notion-select--table notion-select--mini"
                              value={assignUserPick[row.task_id] ?? ''}
                              onChange={(e) =>
                                setAssignUserPick((p) => ({ ...p, [row.task_id]: e.target.value }))
                              }
                              aria-label="Assign member"
                            >
                              <option value="">+ assign…</option>
                              {assignableForTask(row).map((m) => (
                                <option key={m.user_id} value={String(m.user_id)}>
                                  {m.username}
                                </option>
                              ))}
                            </select>
                            <select
                              className="notion-select notion-select--table notion-select--mini"
                              value={assignRolePick[row.task_id] ?? TASK_ASSIGN_ROLES[0]}
                              onChange={(e) =>
                                setAssignRolePick((p) => ({ ...p, [row.task_id]: e.target.value }))
                              }
                              aria-label="Task role"
                            >
                              {TASK_ASSIGN_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="notion-btn notion-btn--small"
                              onClick={() => handleAddAssignee(row)}
                              disabled={!assignUserPick[row.task_id]}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="notion-pill-row">
                          {(row.labels || []).map((lb) => (
                            <LabelPill key={lb.label_id} name={lb.name} color={lb.color} />
                          ))}
                          <select
                            className="notion-select notion-select--table notion-select--mini"
                            value=""
                            onChange={(e) => {
                              const v = e.target.value
                              if (!v) return
                              createTaskLabel(row.task_id, Number(v))
                                .then(loadData)
                                .catch((err) => {
                                  alert(err?.response?.data?.error || err?.message || 'Label error')
                                })
                              e.target.value = ''
                            }}
                            aria-label="Add label"
                          >
                            <option value="">+ label</option>
                            {labelCatalog.map((lb) => (
                              <option key={lb.label_id} value={lb.label_id}>
                                {lb.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="notion-block notion-database">
          <div className="notion-db-head">
            <h2 className="notion-h2">Tasks by sprint</h2>
            <p className="notion-sub">
              Each sprint uses three columns: Todo, In progress, and Done. Drag cards between columns or use + Add
              task to create in that status.
            </p>
          </div>

          <div className="notion-view-tabs">
            {sprints.map((s) => (
              <button
                key={s.sprint_id}
                type="button"
                className={`notion-tab${selectedSprintId === s.sprint_id ? ' is-active' : ''}`}
                onClick={() => setSelectedSprintId(s.sprint_id)}
              >
                {s.sprint_name || `Sprint ${s.sprint_id}`}
              </button>
            ))}
            <button type="button" className="notion-tab notion-tab--ghost" onClick={() => setShowNewSprint((v) => !v)}>
              + New sprint
            </button>
          </div>

          {showNewSprint ? (
            <form className="notion-new-sprint" onSubmit={handleCreateSprint}>
              <input
                className="notion-input"
                placeholder="Sprint name"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                required
              />
              <input
                className="notion-input"
                type="date"
                value={newSprintStart}
                onChange={(e) => setNewSprintStart(e.target.value)}
              />
              <input
                className="notion-input"
                type="date"
                value={newSprintEnd}
                onChange={(e) => setNewSprintEnd(e.target.value)}
              />
              <button type="submit" className="notion-btn notion-btn--blue" disabled={creatingSprint}>
                {creatingSprint ? 'Creating…' : 'Create sprint'}
              </button>
              <button type="button" className="notion-btn" onClick={() => setShowNewSprint(false)}>
                Cancel
              </button>
            </form>
          ) : null}

          {sprints.length === 0 ? (
            <p className="notion-empty-board">Create a sprint to use the board view.</p>
          ) : selectedSprintId == null ? (
            <p className="notion-empty-board">Select a sprint tab.</p>
          ) : (
            <>
              {boardStateIds.todo == null ||
              boardStateIds.in_progress == null ||
              boardStateIds.done == null ? (
                <p className="notion-board-warn" role="status">
                  Could not resolve all three workflow states. Add STATE rows named Todo, In progress, and Done, or
                  ensure at least three states exist (they will map to columns in order).
                </p>
              ) : null}
              <div className="notion-board-toolbar">
                <button
                  type="button"
                  className="notion-btn notion-btn--danger"
                  onClick={async () => {
                    if (!window.confirm('Delete this sprint and all its tasks?')) return
                    try {
                      await deleteSprint(selectedSprintId)
                      await loadData()
                      onRefreshProjects?.()
                    } catch (err) {
                      alert(err?.response?.data?.error || err?.message || 'Delete failed')
                    }
                  }}
                >
                  Delete sprint
                </button>
              </div>

              <div className="sprint-board">
                {BOARD_COLUMNS.map((col) => {
                  const columnTasks = tasksForSprint.filter(
                    (t) => getTaskBoardColumn(t, boardStateIds) === col.key,
                  )
                  const stateIdForCol = boardStateIds[col.key]
                  return (
                    <div
                      key={col.key}
                      className={`board-col board-col--${col.variant}`}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const rawTaskId = e.dataTransfer.getData('task-id')
                        const droppedId = toPositiveInt(rawTaskId)
                        if (droppedId == null || stateIdForCol == null) {
                          setDragTaskId(null)
                          return
                        }
                        handleMoveTask(droppedId, stateIdForCol)
                      }}
                    >
                      <div className={`board-col-head board-col-head--${col.variant}`}>
                        <span className="board-col-title">{col.label}</span>
                        <span className="board-col-count">{columnTasks.length}</span>
                      </div>
                      <div className="board-col-body">
                        <button
                          type="button"
                          className="board-add-task"
                          onClick={() =>
                            openNewTask({
                              sprint_id: selectedSprintId,
                              lock_sprint: true,
                              ...(stateIdForCol != null ? { state_id: stateIdForCol } : {}),
                            })
                          }
                          disabled={stateIdForCol == null}
                        >
                          + Add task
                        </button>
                        <div className="board-col-cards">
                          {columnTasks.length === 0 ? (
                            <div className="board-empty" aria-hidden>
                              No tasks yet
                            </div>
                          ) : null}
                          {columnTasks.map((t) => (
                            <div
                              key={t.task_id}
                              className="board-card"
                              draggable
                              onDragStart={(e) => {
                                const taskId = String(t.task_id)
                                e.dataTransfer.setData('task-id', taskId)
                                e.dataTransfer.setData('text/plain', '')
                                e.dataTransfer.effectAllowed = 'move'
                                setDragTaskId(t.task_id)
                              }}
                              onDragEnd={() => setDragTaskId(null)}
                            >
                              <div className="board-card-title">{t.task_name}</div>
                              <button
                                type="button"
                                className="board-card-delete"
                                title="Delete task"
                                aria-label={`Delete ${t.task_name}`}
                                onClick={async () => {
                                  if (!window.confirm('Delete this task?')) return
                                  try {
                                    await deleteTask(t.task_id)
                                    await loadData()
                                    onRefreshProjects?.()
                                  } catch (err) {
                                    alert(err?.response?.data?.error || err?.message || 'Delete failed')
                                  }
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {taskModal ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTaskModal(null)
          }}
        >
          <div className="modal-panel" role="dialog" aria-labelledby="task-modal-title">
            <form onSubmit={submitNewTask}>
              <div className="modal-header">
                <h2 id="task-modal-title" className="modal-title">
                  New task
                </h2>
              </div>
              <div className="modal-body">
                <div className="field">
                  <label className="field-label" htmlFor="nt-name">
                    Name
                  </label>
                  <input
                    id="nt-name"
                    className="field-input"
                    value={taskModal.task_name}
                    onChange={(e) => setTaskModal({ ...taskModal, task_name: e.target.value })}
                    required
                  />
                </div>
                {!taskModal.lock_sprint ? (
                  <div className="field">
                    <label className="field-label" htmlFor="nt-sprint">
                      Sprint
                    </label>
                    <select
                      id="nt-sprint"
                      className="field-input"
                      value={taskModal.sprint_id != null ? String(taskModal.sprint_id) : ''}
                      onChange={(e) =>
                        setTaskModal({ ...taskModal, sprint_id: Number(e.target.value) })
                      }
                      required
                    >
                      <option value="">Select sprint</option>
                      {sprints.map((s) => (
                        <option key={s.sprint_id} value={String(s.sprint_id)}>
                          {s.sprint_name || `Sprint ${s.sprint_id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {!taskModal.lock_sprint ? (
                  <div className="field">
                    <label className="field-label" htmlFor="nt-state">
                      State
                    </label>
                    <select
                      id="nt-state"
                      className="field-input"
                      value={taskModal.state_id != null ? String(taskModal.state_id) : ''}
                      onChange={(e) =>
                        setTaskModal({
                          ...taskModal,
                          state_id: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    >
                      <option value="">—</option>
                      {boardStateOptions.map((s) => (
                        <option key={s.state_id} value={String(s.state_id)}>
                          {s.state_name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {!taskModal.lock_sprint ? (
                  <div className="field notion-subtle-hint">
                    Labels are auto-set based on Priority.
                  </div>
                ) : null}
                <div className="field">
                  <label className="field-label" htmlFor="nt-pri">
                    Priority
                  </label>
                  <select
                    id="nt-pri"
                    className="field-input"
                    value={taskModal.priority_id != null ? String(taskModal.priority_id) : ''}
                    onChange={(e) => {
                      const nextPriorityId = e.target.value === '' ? null : Number(e.target.value)
                      setTaskModal((prev) => ({
                        ...prev,
                        priority_id: nextPriorityId,
                        selectedLabelIds: getAutoLabelIdsForPriorityId(nextPriorityId),
                      }))
                    }}
                  >
                    <option value="">—</option>
                    {priorities.map((p) => (
                      <option key={p.priority_id} value={String(p.priority_id)}>
                        {p.priority_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="nt-desc">
                    Description
                  </label>
                  <input
                    id="nt-desc"
                    className="field-input"
                    value={taskModal.description || ''}
                    onChange={(e) => setTaskModal({ ...taskModal, description: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="nt-due">
                    Due
                  </label>
                  <input
                    id="nt-due"
                    className="field-input"
                    type="date"
                    value={taskModal.due_date || ''}
                    onChange={(e) => setTaskModal({ ...taskModal, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setTaskModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={taskSubmitting}>
                  {taskSubmitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
