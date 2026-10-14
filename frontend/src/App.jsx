import { useCallback, useEffect, useState } from 'react'
import { api, clearCredentials, setCredentials } from './api.js'

const emptyPost = {
  title: '',
  content: '',
  categoryId: '',
  imageUrl: '',
  allowRegistration: false,
  maxParticipants: ''
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusBadgeClass(status) {
  switch (status) {
    case 'APPROVED': return 'badge-success'
    case 'PENDING': return 'badge-warning'
    case 'REJECTED': return 'badge-danger'
    case 'CANCELLED': return 'badge-muted'
    case 'RESOLVED': return 'badge-info'
    default: return 'badge-default'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'APPROVED': return 'Đã được duyệt'
    case 'PENDING': return 'Đang chờ duyệt'
    case 'REJECTED': return 'Từ chối'
    case 'CANCELLED': return 'Đã hủy'
    case 'RESOLVED': return 'Đã hoàn tất'
    case 'PUBLISHED': return 'Đang mở'
    default: return status
  }
}

function App() {
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [pageInfo, setPageInfo] = useState({ page: 0, totalPages: 1, totalElements: 0 })
  const [selectedPost, setSelectedPost] = useState(null)
  const [activeTab, setActiveTab] = useState('feed') // 'feed' | 'my-posts' | 'my-registrations'
  const [filters, setFilters] = useState({ keyword: '', categoryId: '', registrationOnly: false })
  const [myRegistrations, setMyRegistrations] = useState([])
  const [dialog, setDialog] = useState(null) // 'login' | 'post' | 'apply' | 'applicants'
  const [applicantPostId, setApplicantPostId] = useState(null)
  const [notice, setNotice] = useState('')

  const loadPosts = useCallback(async () => {
    const query = new URLSearchParams()
    if (filters.keyword) query.set('keyword', filters.keyword)
    if (filters.categoryId) query.set('categoryId', filters.categoryId)
    if (filters.registrationOnly) query.set('allowRegistration', 'true')
    if (activeTab === 'my-posts') query.set('myPosts', 'true')
    query.set('page', '0')
    query.set('size', '15')

    try {
      const page = await api(`/posts?${query}`)
      setPosts(page.content)
      setPageInfo({ page: page.page, totalPages: page.totalPages, totalElements: page.totalElements })
    } catch (error) {
      setNotice(error.message)
    }
  }, [filters, activeTab])

  const loadMyRegistrations = useCallback(async () => {
    try {
      const list = await api('/users/me/registrations')
      setMyRegistrations(list)
    } catch (error) {
      setNotice(error.message)
    }
  }, [])

  useEffect(() => {
    api('/categories').then(setCategories).catch((error) => setNotice(error.message))
    api('/auth/me').then(setUser).catch(() => clearCredentials())
  }, [])

  useEffect(() => {
    let active = true
    if (activeTab === 'my-registrations') {
      api('/users/me/registrations')
        .then((list) => { if (active) setMyRegistrations(list) })
        .catch((err) => { if (active) setNotice(err.message) })
    } else {
      const query = new URLSearchParams()
      if (filters.keyword) query.set('keyword', filters.keyword)
      if (filters.categoryId) query.set('categoryId', filters.categoryId)
      if (filters.registrationOnly) query.set('allowRegistration', 'true')
      if (activeTab === 'my-posts') query.set('myPosts', 'true')
      query.set('page', '0')
      query.set('size', '15')
      api(`/posts?${query}`)
        .then((page) => {
          if (active) {
            setPosts(page.content)
            setPageInfo({ page: page.page, totalPages: page.totalPages, totalElements: page.totalElements })
          }
        })
        .catch((err) => { if (active) setNotice(err.message) })
    }
    return () => { active = false }
  }, [filters, activeTab])

  async function openPost(id) {
    try {
      const data = await api(`/posts/${id}`)
      setSelectedPost(data)
    } catch (error) {
      setNotice(error.message)
    }
  }

  function logout() {
    clearCredentials()
    setUser(null)
    setSelectedPost(null)
    setActiveTab('feed')
    setNotice('Đã đăng xuất thành công')
  }

  async function refreshSelected() {
    if (selectedPost) await openPost(selectedPost.id)
    if (activeTab === 'my-registrations') {
      await loadMyRegistrations()
    } else {
      await loadPosts()
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button className="brand" onClick={() => { setSelectedPost(null); setActiveTab('feed') }}>
            <span className="brand-mark">CH</span>
            <div className="brand-text">
              <span className="brand-title">Campus Hub</span>
              <span className="brand-subtitle">PTIT Student Network</span>
            </div>
          </button>

          {user && (
            <nav className="subnav">
              <button
                className={`nav-tab ${activeTab === 'feed' && !selectedPost ? 'active' : ''}`}
                onClick={() => { setSelectedPost(null); setActiveTab('feed') }}
              >
                Trang chủ
              </button>
              <button
                className={`nav-tab ${activeTab === 'my-posts' && !selectedPost ? 'active' : ''}`}
                onClick={() => { setSelectedPost(null); setActiveTab('my-posts') }}
              >
                Bài viết của tôi
              </button>
              <button
                className={`nav-tab ${activeTab === 'my-registrations' && !selectedPost ? 'active' : ''}`}
                onClick={() => { setSelectedPost(null); setActiveTab('my-registrations') }}
              >
                Đăng ký của tôi
              </button>
            </nav>
          )}
        </div>

        <div className="topbar-right">
          {user ? (
            <div className="user-menu">
              <div className="user-badge">
                <span className="avatar">{user.displayName.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.displayName}</span>
                {user.role === 'ADMIN' && <span className="badge badge-admin">Quản trị</span>}
              </div>
              <button className="button primary" onClick={() => setDialog('post')}>+ Đăng tin mới</button>
              <button className="button secondary" onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <button className="button primary" onClick={() => setDialog('login')}>Đăng nhập / Đăng ký</button>
          )}
        </div>
      </header>

      <main className="main-content">
        {notice && (
          <div className="notice-banner" role="alert">
            <span>{notice}</span>
            <button className="notice-close" onClick={() => setNotice('')}>×</button>
          </div>
        )}

        {selectedPost ? (
          <PostDetail
            post={selectedPost}
            user={user}
            onBack={() => setSelectedPost(null)}
            onChanged={refreshSelected}
            onDeleted={() => { setSelectedPost(null); loadPosts() }}
            setNotice={setNotice}
            onOpenApply={() => setDialog('apply')}
            onOpenApplicants={(id) => { setApplicantPostId(id); setDialog('applicants') }}
          />
        ) : activeTab === 'my-registrations' ? (
          <MyRegistrationsView
            registrations={myRegistrations}
            onOpenPost={openPost}
            onCancelled={() => { loadMyRegistrations(); setNotice('Đã hủy đăng ký thành công') }}
            setNotice={setNotice}
          />
        ) : (
          <>
            <section className="hero">
              <div className="hero-content">
                <div className="hero-tag">Cổng thông tin & kết nối sinh viên PTIT</div>
                <h1>Không gian chia sẻ sự kiện, tìm nhóm và hỗ trợ học tập</h1>
                <p>Nơi sinh viên đăng ký tham gia sự kiện, tìm đồng đội làm đồ án và trao đổi đồ dùng nhanh chóng, tin cậy.</p>
              </div>
              <div className="hero-stats">
                <div className="stat-card">
                  <strong>{pageInfo.totalElements}</strong>
                  <span>Bài đăng hiện có</span>
                </div>
                <div className="stat-card">
                  <strong>{categories.length}</strong>
                  <span>Chuyên mục</span>
                </div>
              </div>
            </section>

            <section className="filters-card">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  value={filters.keyword}
                  placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                  onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
                />
              </div>

              <select
                className="category-select"
                value={filters.categoryId}
                onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}
              >
                <option value="">Tất cả chuyên mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={filters.registrationOnly}
                  onChange={(e) => setFilters({ ...filters, registrationOnly: e.target.checked })}
                />
                <span>Chỉ bài mở đăng ký</span>
              </label>

              {(filters.keyword || filters.categoryId || filters.registrationOnly) && (
                <button
                  className="button text-button"
                  onClick={() => setFilters({ keyword: '', categoryId: '', registrationOnly: false })}
                >
                  Xóa bộ lọc
                </button>
              )}
            </section>

            <section className="post-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onOpen={openPost} />
              ))}
              {!posts.length && (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>Không tìm thấy bài đăng nào phù hợp</h3>
                  <p>Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc chuyên mục.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p><strong>Campus Hub</strong> · Nền tảng kết nối sinh viên PTIT — Mini Project Session 13 DevOps</p>
          <p>Phát triển bởi Nhóm sinh viên PTIT · React + Spring Boot + MySQL + Docker</p>
        </div>
      </footer>

      {dialog === 'login' && (
        <AuthDialog
          onClose={() => setDialog(null)}
          onLogin={(loggedInUser) => {
            setUser(loggedInUser)
            setDialog(null)
            setNotice(`Chào mừng ${loggedInUser.displayName} đã đăng nhập!`)
            loadPosts()
          }}
        />
      )}

      {dialog === 'post' && (
        <PostDialog
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            setNotice('Đã đăng bài thành công!')
            loadPosts()
          }}
        />
      )}

      {dialog === 'apply' && selectedPost && (
        <ApplyDialog
          post={selectedPost}
          onClose={() => setDialog(null)}
          onApplied={() => {
            setDialog(null)
            setNotice('Gửi đơn đăng ký thành công! Vui lòng chờ người đăng bài xét duyệt.')
            refreshSelected()
          }}
        />
      )}

      {dialog === 'applicants' && applicantPostId && (
        <ApplicantsDialog
          postId={applicantPostId}
          onClose={() => setDialog(null)}
          onUpdated={() => {
            refreshSelected()
          }}
          setNotice={setNotice}
        />
      )}
    </div>
  )
}

function PostCard({ post, onOpen }) {
  return (
    <article className="post-card" onClick={() => onOpen(post.id)}>
      {post.imageUrl && (
        <div className="card-image-box">
          <img src={post.imageUrl} alt={post.title} loading="lazy" />
        </div>
      )}
      <div className="card-body">
        <div className="card-top">
          <span className="tag-category">{post.category.name}</span>
          <span className="card-date">{formatDate(post.createdAt)}</span>
        </div>

        <h2 className="card-title">{post.title}</h2>
        <p className="card-snippet">{post.content}</p>

        {post.allowRegistration && (
          <div className="card-registration-info">
            <span className="registration-pill">
              👥 {post.maxParticipants ? `${post.approvedParticipantCount}/${post.maxParticipants} đã duyệt` : `${post.approvedParticipantCount} đã tham gia`}
            </span>
            {post.userRegistrationStatus && (
              <span className={`status-tag ${statusBadgeClass(post.userRegistrationStatus)}`}>
                {statusLabel(post.userRegistrationStatus)}
              </span>
            )}
          </div>
        )}

        <div className="card-footer">
          <div className="author-info">
            <span className="author-avatar">{post.author.displayName.charAt(0)}</span>
            <span className="author-name">{post.author.displayName}</span>
          </div>
          <div className="card-stats">
            <span>♥ {post.reactionCount}</span>
            <span>💬 {post.commentCount}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function PostDetail({ post, user, onBack, onChanged, onDeleted, setNotice, onOpenApply, onOpenApplicants }) {
  const [comment, setComment] = useState('')
  const canManage = user && (user.id === post.author.id || user.role === 'ADMIN')

  async function act(action, success) {
    try {
      await action()
      setNotice(success)
      await onChanged()
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <section className="detail-view">
      <button className="back-button" onClick={onBack}>
        ← Quay lại danh sách
      </button>

      <div className="detail-card">
        {post.imageUrl && (
          <div className="detail-cover-box">
            <img src={post.imageUrl} alt={post.title} />
          </div>
        )}

        <div className="detail-body">
          <div className="detail-header-tags">
            <span className="tag-category">{post.category.name}</span>
            <span className={`status-tag ${statusBadgeClass(post.status)}`}>{statusLabel(post.status)}</span>
            <span className="card-date">Đăng lúc {formatDate(post.createdAt)}</span>
          </div>

          <h1 className="detail-title">{post.title}</h1>
          <p className="detail-author">
            Đăng bởi <strong>{post.author.displayName}</strong> ({post.author.username})
          </p>

          <div className="detail-content">{post.content}</div>

          {/* Registration feature section */}
          {post.allowRegistration && (
            <div className="registration-box">
              <div className="registration-header">
                <h3>📌 Hoạt động có nhận đăng ký tham gia</h3>
                <div className="capacity-badge">
                  {post.maxParticipants
                    ? `Chỉ tiêu: ${post.approvedParticipantCount}/${post.maxParticipants} người đã duyệt`
                    : `Đã duyệt: ${post.approvedParticipantCount} người tham gia`}
                  {canManage && post.pendingParticipantCount > 0 && (
                    <span className="pending-alert"> ({post.pendingParticipantCount} đơn đang chờ duyệt)</span>
                  )}
                </div>
              </div>

              {/* For post author or admin */}
              {canManage ? (
                <div className="reg-author-actions">
                  <button className="button primary" onClick={() => onOpenApplicants(post.id)}>
                    📋 Quản lý danh sách đăng ký ({post.approvedParticipantCount + post.pendingParticipantCount})
                  </button>
                </div>
              ) : user ? (
                /* For candidate student */
                <div className="reg-candidate-actions">
                  {post.userRegistrationStatus === 'PENDING' && (
                    <div className="reg-status-box warning">
                      <span>⏳ Đơn đăng ký của bạn đang chờ chủ bài đăng xét duyệt.</span>
                      <button
                        className="button danger-outline sm"
                        onClick={() => act(() => api(`/posts/${post.id}/registrations/me`, { method: 'DELETE' }), 'Đã hủy đăng ký')}
                      >
                        Hủy đăng ký
                      </button>
                    </div>
                  )}
                  {post.userRegistrationStatus === 'APPROVED' && (
                    <div className="reg-status-box success">
                      <span>🎉 Chúc mừng! Đơn đăng ký tham gia của bạn đã được CHẤP NHẬN.</span>
                    </div>
                  )}
                  {post.userRegistrationStatus === 'REJECTED' && (
                    <div className="reg-status-box danger">
                      <span>❌ Đơn đăng ký của bạn đã bị từ chối.</span>
                      <button className="button secondary sm" onClick={onOpenApply}>Đăng ký lại</button>
                    </div>
                  )}
                  {post.userRegistrationStatus === 'CANCELLED' && (
                    <div className="reg-status-box muted">
                      <span>Đơn đăng ký trước đó của bạn đã hủy.</span>
                      <button className="button primary sm" onClick={onOpenApply}>Đăng ký tham gia lại</button>
                    </div>
                  )}
                  {!post.userRegistrationStatus && (
                    <button className="button primary" onClick={onOpenApply}>
                      ✍️ Đăng ký tham gia ngay
                    </button>
                  )}
                </div>
              ) : (
                <p className="reg-guest-prompt">
                  Vui lòng <button className="link-inline" onClick={() => {}}>đăng nhập</button> để đăng ký tham gia hoạt động này.
                </p>
              )}
            </div>
          )}

          <div className="detail-actions">
            <button
              className={`button ${post.reactedByCurrentUser ? 'button-liked' : 'secondary'}`}
              disabled={!user}
              onClick={() => act(() => api(`/posts/${post.id}/reaction`, { method: 'POST' }), 'Đã cập nhật quan tâm')}
            >
              ♥ {post.reactionCount} {post.reactedByCurrentUser ? 'Đã bày tỏ quan tâm' : 'Quan tâm'}
            </button>

            {canManage && post.status !== 'RESOLVED' && (
              <button
                className="button secondary"
                onClick={() => act(() => api(`/posts/${post.id}/status`, {
                  method: 'PATCH', body: JSON.stringify({ status: 'RESOLVED' }),
                }), 'Đã đánh dấu hoàn tất hoạt động')}
              >
                ✓ Đánh dấu hoàn tất
              </button>
            )}

            {user?.role === 'ADMIN' && post.status !== 'HIDDEN' && (
              <button
                className="button secondary"
                onClick={() => act(() => api(`/posts/${post.id}/status`, {
                  method: 'PATCH', body: JSON.stringify({ status: 'HIDDEN' }),
                }), 'Đã ẩn bài đăng')}
              >
                👁️ Ẩn bài đăng
              </button>
            )}

            {canManage && (
              <button
                className="button danger"
                onClick={async () => {
                  if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này? Mọi bình luận và đăng ký liên quan sẽ bị xóa vĩnh viễn.')) return
                  try {
                    await api(`/posts/${post.id}`, { method: 'DELETE' })
                    setNotice('Đã xóa bài đăng thành công')
                    onDeleted()
                  } catch (error) {
                    setNotice(error.message)
                  }
                }}
              >
                🗑️ Xóa bài
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="comments-section">
        <h2>Bình luận & Thảo luận ({post.commentCount})</h2>

        {user ? (
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault()
              act(
                () => api(`/posts/${post.id}/comments`, { method: 'POST', body: JSON.stringify({ content: comment }) }),
                'Đã gửi bình luận'
              ).then(() => setComment(''))
            }}
          >
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Viết phản hồi hoặc đặt câu hỏi cho chủ bài đăng..."
              required
              maxLength="1000"
              rows="3"
            />
            <button className="button primary">Gửi bình luận</button>
          </form>
        ) : (
          <p className="comment-login-hint">Đăng nhập để tham gia thảo luận và gửi câu hỏi.</p>
        )}

        <div className="comment-list">
          {post.comments?.map((item) => (
            <div className="comment-item" key={item.id}>
              <div className="comment-top">
                <span className="comment-author">{item.author.displayName}</span>
                <span className="comment-time">{formatDate(item.createdAt)}</span>
              </div>
              <p className="comment-text">{item.content}</p>
            </div>
          ))}
          {!post.comments?.length && (
            <div className="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!</div>
          )}
        </div>
      </div>
    </section>
  )
}

function MyRegistrationsView({ registrations, onOpenPost, onCancelled, setNotice }) {
  async function cancelReg(postId) {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đăng ký này?')) return
    try {
      await api(`/posts/${postId}/registrations/me`, { method: 'DELETE' })
      onCancelled()
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <section className="my-registrations-section">
      <div className="section-header">
        <h1>Hoạt động & Sự kiện tôi đã đăng ký ({registrations.length})</h1>
        <p>Theo dõi tiến độ xét duyệt và kết quả tham gia các hoạt động kết nối sinh viên.</p>
      </div>

      <div className="registrations-table-card">
        {registrations.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Hoạt động / Bài đăng</th>
                <th>Thông tin liên hệ đã cung cấp</th>
                <th>Lời nhắn</th>
                <th>Thời gian gửi</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>
                    <button className="link-button" onClick={() => onOpenPost(reg.postId)}>
                      <strong>{reg.postTitle}</strong>
                    </button>
                  </td>
                  <td>{reg.contactInfo}</td>
                  <td>{reg.message || '—'}</td>
                  <td>{formatDate(reg.createdAt)}</td>
                  <td>
                    <span className={`status-tag ${statusBadgeClass(reg.status)}`}>
                      {statusLabel(reg.status)}
                    </span>
                  </td>
                  <td>
                    {reg.status === 'PENDING' ? (
                      <button className="button danger-outline sm" onClick={() => cancelReg(reg.postId)}>
                        Hủy đăng ký
                      </button>
                    ) : (
                      <button className="button secondary sm" onClick={() => onOpenPost(reg.postId)}>
                        Xem bài
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Bạn chưa gửi đơn đăng ký nào</h3>
            <p>Khám phá trang chủ và tham gia các sự kiện, nhóm học tập thú vị nhé!</p>
          </div>
        )}
      </div>
    </section>
  )
}

function ApplyDialog({ post, onClose, onApplied }) {
  const [form, setForm] = useState({ contactInfo: '', message: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api(`/posts/${post.id}/registrations`, {
        method: 'POST',
        body: JSON.stringify(form)
      })
      onApplied()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog title={`Đăng ký tham gia: ${post.title}`} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        <p className="dialog-desc">
          Vui lòng cung cấp số điện thoại, Zalo hoặc Email để người đăng bài có thể liên hệ và xác nhận với bạn.
        </p>
        <label>
          Thông tin liên hệ (SĐT / Zalo / Email) *
          <input
            required
            maxLength="150"
            placeholder="Ví dụ: Zalo 0912345678 - nam@ptit.edu.vn"
            value={form.contactInfo}
            onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
          />
        </label>
        <label>
          Lời nhắn / Giới thiệu bản thân
          <textarea
            maxLength="500"
            rows="4"
            placeholder="Nêu lý do bạn muốn tham gia, kinh nghiệm hoặc kỹ năng liên quan..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>Hủy</button>
          <button className="button primary" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function ApplicantsDialog({ postId, onClose, onUpdated, setNotice }) {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api(`/posts/${postId}/registrations`)
      .then((data) => {
        if (active) {
          setApplicants(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setNotice(err.message)
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [postId, setNotice])

  async function load() {
    try {
      const data = await api(`/posts/${postId}/registrations`)
      setApplicants(data)
    } catch (err) {
      setNotice(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function changeStatus(regId, status) {
    try {
      await api(`/posts/${postId}/registrations/${regId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      setNotice(`Đã chuyển trạng thái sang ${statusLabel(status)}`)
      await load()
      await onUpdated()
    } catch (err) {
      setNotice(err.message)
    }
  }

  return (
    <Dialog title="Quản lý danh sách người đăng ký" onClose={onClose} width="large">
      <div className="applicants-dialog-content">
        {loading ? (
          <p>Đang tải danh sách...</p>
        ) : applicants.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Họ tên & Tài khoản</th>
                  <th>Thông tin liên hệ</th>
                  <th>Lời nhắn</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.user.displayName}</strong>
                      <div className="text-muted sm">@{item.user.username}</div>
                    </td>
                    <td>{item.contactInfo}</td>
                    <td className="message-cell">{item.message || '—'}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <span className={`status-tag ${statusBadgeClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {item.status !== 'APPROVED' && (
                          <button
                            className="button success-btn sm"
                            onClick={() => changeStatus(item.id, 'APPROVED')}
                          >
                            Duyệt
                          </button>
                        )}
                        {item.status !== 'REJECTED' && (
                          <button
                            className="button danger-btn sm"
                            onClick={() => changeStatus(item.id, 'REJECTED')}
                          >
                            Từ chối
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>Chưa có ai đăng ký tham gia bài đăng này.</p>
          </div>
        )}
      </div>
    </Dialog>
  )
}

function AuthDialog({ onClose, onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', displayName: '', password: '' })
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: JSON.stringify(form) })
      }
      setCredentials(form.username, form.password)
      onLogin(await api('/auth/me'))
    } catch (requestError) {
      clearCredentials()
      setError(requestError.message)
    }
  }

  return (
    <Dialog title={mode === 'login' ? 'Đăng nhập vào Campus Hub' : 'Tạo tài khoản sinh viên mới'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          Tên đăng nhập
          <input
            required
            minLength="3"
            value={form.username}
            placeholder="vd: student, admin, hoang_nam..."
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
        </label>
        {mode === 'register' && (
          <label>
            Họ và tên hiển thị
            <input
              required
              value={form.displayName}
              placeholder="vd: Nguyễn Hoàng Nam"
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            />
          </label>
        )}
        <label>
          Mật khẩu
          <input
            required
            minLength="6"
            type="password"
            value={form.password}
            placeholder="Tối thiểu 6 ký tự"
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        <button className="button primary">{mode === 'login' ? 'Đăng nhập' : 'Hoàn tất đăng ký'}</button>
        <button
          type="button"
          className="text-button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
        >
          {mode === 'login' ? 'Chưa có tài khoản? Nhấn để đăng ký' : 'Đã có tài khoản? Đăng nhập ngay'}
        </button>
      </form>
    </Dialog>
  )
}

function PostDialog({ categories, onClose, onSaved }) {
  const [form, setForm] = useState(emptyPost)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        categoryId: Number(form.categoryId),
        imageUrl: form.imageUrl.trim() || null,
        allowRegistration: form.allowRegistration,
        maxParticipants: form.allowRegistration && form.maxParticipants ? Number(form.maxParticipants) : null
      }
      await api('/posts', { method: 'POST', body: JSON.stringify(payload) })
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog title="Tạo bài đăng mới" onClose={onClose} width="medium">
      <form className="form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          Tiêu đề bài đăng *
          <input
            required
            maxLength="160"
            placeholder="vd: Cần tìm bạn cùng nhóm môn DevOps, Rơi thẻ sinh viên..."
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </label>

        <label>
          Chuyên mục *
          <select
            required
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            <option value="">Chọn chuyên mục bài đăng</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>

        <label>
          Nội dung chi tiết *
          <textarea
            required
            maxLength="10000"
            rows="6"
            placeholder="Mô tả cụ thể thời gian, địa điểm, mục đích, yêu cầu..."
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
          />
        </label>

        <label>
          Đường dẫn hình ảnh minh họa (URL - tùy chọn)
          <input
            type="url"
            maxLength="500"
            placeholder="https://example.com/hinh-anh.jpg"
            value={form.imageUrl}
            onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
          />
        </label>

        <div className="registration-toggle-box">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.allowRegistration}
              onChange={(e) => setForm({ ...form, allowRegistration: e.target.checked })}
            />
            <span>Mở chức năng đăng ký tham gia (Dành cho Sự kiện / Tìm đồng đội / Mượn đồ)</span>
          </label>

          {form.allowRegistration && (
            <label className="sub-field">
              Số lượng người tham gia tối đa (để trống nếu không giới hạn):
              <input
                type="number"
                min="1"
                max="5000"
                placeholder="vd: 3 hoặc 50"
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
              />
            </label>
          )}
        </div>

        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>Hủy</button>
          <button className="button primary" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Đăng bài ngay'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function Dialog({ title, onClose, children, width = 'normal' }) {
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className={`dialog dialog-${width}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-title">
          <h2>{title}</h2>
          <button className="dialog-close-btn" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div className="dialog-content">{children}</div>
      </section>
    </div>
  )
}

export default App
