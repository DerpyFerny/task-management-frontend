function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M6 2V1h4v1h3v1H3V2h3zM4 5v8a2 2 0 002 2h4a2 2 0 002-2V5H4zm2 2h1v5H6V7zm3 0h1v5H9V7z" />
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

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v6a1 1 0 001 1h4v-4h2v4h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
    </svg>
  )
}

export default function HomeSidebar({
  users,
  loading,
  selectedUserId,
  onSelectUser,
  onDeleteUser,
  onOpenCreateUser,
  onGoAllUsers,
}) {
  const allUsersActive = !selectedUserId

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">Workspace</div>
      <button
        type="button"
        className={`sidebar-nav-item${allUsersActive ? ' is-active' : ''}`}
        onClick={onGoAllUsers}
      >
        <HomeIcon />
        All users
      </button>

      <div className="sidebar-section-label">People</div>
      <div className="sidebar-scroll">
        {loading ? (
          <>
            <div className="skeleton-row">
              <div className="loading-line" style={{ width: '75%' }} />
            </div>
            <div className="skeleton-row">
              <div className="loading-line" style={{ width: '60%' }} />
            </div>
          </>
        ) : users.length === 0 ? (
          <p className="empty-inline" style={{ padding: '12px 8px', fontSize: 13 }}>
            No people yet.
          </p>
        ) : (
          users.map((u) => {
            const initial = (u.username?.trim()?.[0] || '?').toUpperCase()
            const active = selectedUserId === u.user_id
            return (
              <div key={u.user_id} className="sidebar-user-wrap">
                <button
                  type="button"
                  className={`sidebar-user-row${active ? ' is-active' : ''}`}
                  onClick={() => onSelectUser(u.user_id)}
                >
                  <span className="sidebar-user-avatar">{initial}</span>
                  <span className="sidebar-user-name">{u.username}</span>
                </button>
                <button
                  type="button"
                  className="sidebar-user-delete"
                  title="Remove"
                  aria-label={`Delete ${u.username}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteUser(u.user_id)
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-new-user" onClick={onOpenCreateUser}>
          <PlusIcon />
          New user
        </button>
      </div>
    </aside>
  )
}
