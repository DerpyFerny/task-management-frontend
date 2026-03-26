function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M6 2V1h4v1h3v1H3V2h3zM4 5v8a2 2 0 002 2h4a2 2 0 002-2V5H4zm2 2h1v5H6V7zm3 0h1v5H9V7z" />
    </svg>
  )
}

export default function UserGrid({
  users,
  loading,
  selectedUserId,
  onSelectUser,
  onDeleteUser,
}) {
  if (loading) {
    return (
      <div className="user-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="user-card-main" style={{ pointerEvents: 'none' }}>
            <div className="user-card-banner user-card-banner--skeleton" />
            <div className="user-card-body">
              <div className="user-card-avatar-ring" style={{ background: '#2a2a2e' }}>
                <div className="loading-line" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              </div>
              <div className="loading-line" style={{ width: '55%', marginBottom: 8 }} />
              <div className="loading-line" style={{ width: '85%', height: 8 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="user-grid-empty">
        No members yet. Click <strong>New user</strong> in the sidebar.
      </div>
    )
  }

  return (
    <div className="user-grid">
      {users.map((u) => {
        const initial = (u.username?.trim()?.[0] || '?').toUpperCase()
        const active = selectedUserId === u.user_id

        return (
          <article key={u.user_id} className={`user-card-main${active ? ' is-selected' : ''}`}>
            <button
              type="button"
              className="user-card-hit"
              onClick={() => onSelectUser(u.user_id)}
              aria-pressed={active}
              aria-label={`Open projects for ${u.username}`}
            >
              <div className="user-card-banner" aria-hidden />
              <div className="user-card-body">
                <div className="user-card-avatar-ring">
                  <span className="user-card-avatar">{initial}</span>
                </div>
                <h3 className="user-card-name">{u.username}</h3>
                <p className="user-card-email">{u.email}</p>
                <div className="user-card-divider" />
                <span className="user-card-cta">Open projects +</span>
              </div>
            </button>
            <button
              type="button"
              className="user-card-delete"
              title="Remove member"
              aria-label={`Delete ${u.username}`}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteUser(u.user_id)
              }}
            >
              <TrashIcon />
            </button>
          </article>
        )
      })}
    </div>
  )
}
