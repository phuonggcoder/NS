import { useEffect, useState, type FormEvent } from 'react';
import { Copy, ExternalLink, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/templates';
import type { ClientFeedbackItem, ClientProject, ProjectStatus } from '../types/spec';
import { fetchFeedbackForSlug, PROJECT_STATUS_META } from '../utils/projects';

interface ProjectsDrawerProps {
  open: boolean;
  projects: ClientProject[];
  activeProjectId: string;
  onClose: () => void;
  onSelectProject: (id: string) => void;
  onCreateProject: (params: {
    projectName: string;
    clientName: string;
    templateId: string;
    notes: string;
  }) => void;
  onDuplicateProject: (project: ClientProject) => void;
  onDeleteProject: (id: string) => void;
  onUpdateStatus: (id: string, status: ProjectStatus) => void;
}

export function ProjectsDrawer({
  open,
  projects,
  activeProjectId,
  onClose,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onUpdateStatus,
}: ProjectsDrawerProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [templateId, setTemplateId] = useState('creator-store');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<ClientFeedbackItem[]>([]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  useEffect(() => {
    if (!open || !activeProject) return;
    fetchFeedbackForSlug(activeProject.slug).then(setFeedback);
  }, [open, activeProject]);

  if (!open) return null;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    onCreateProject({
      projectName: projectName.trim(),
      clientName: clientName.trim() || 'Khách hàng mới',
      templateId,
      notes,
    });
    setProjectName('');
    setClientName('');
    setNotes('');
    setShowNewForm(false);
  };

  return (
    <div
      className="st-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="st-modal" style={{ maxWidth: 760 }}>
        <div className="st-modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Quản lý Dự án Khách hàng ({projects.length})
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Tạo trang riêng cho từng khách hàng, theo dõi trạng thái duyệt mẫu & góp ý
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="st-btn st-btn-sm st-btn-primary"
              onClick={() => setShowNewForm((prev) => !prev)}
            >
              <Plus size={14} />
              <span>{showNewForm ? 'Đóng form' : 'Tạo khách hàng mới'}</span>
            </button>
            <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="st-modal-body">
          {showNewForm && (
            <form
              onSubmit={handleCreate}
              className="st-subcard"
              style={{ background: '#eff6ff', borderColor: '#bfdbfe', marginBottom: 16 }}
            >
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>
                Khởi tạo Landing Page cho khách hàng mới
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="st-field">
                  <label className="st-label">Tên dự án / Thương hiệu *</label>
                  <input
                    type="text"
                    required
                    className="st-input"
                    placeholder="VD: Nha khoa Hạnh Phúc"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="st-field">
                  <label className="st-label">Tên khách hàng</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="VD: Anh Tuấn"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>
              <div className="st-field">
                <label className="st-label">Mẫu khởi đầu</label>
                <select
                  className="st-select"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  {STARTER_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="st-field">
                <label className="st-label">Ghi chú yêu cầu của khách</label>
                <input
                  type="text"
                  className="st-input"
                  placeholder="Tone màu, sản phẩm chủ lực..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button type="submit" className="st-btn st-btn-primary">
                Tạo và mở chỉnh sửa ngay
              </button>
            </form>
          )}

          <div className="st-group">
            <div className="st-group-title">Danh sách khách hàng</div>
            {projects.map((proj) => {
              const isCurrent = proj.id === activeProjectId;
              const statusMeta = PROJECT_STATUS_META[proj.status];
              return (
                <div
                  key={proj.id}
                  className="st-subcard"
                  style={{
                    borderColor: isCurrent ? '#007aff' : '#e2e8f0',
                    background: isCurrent ? '#f0f7ff' : '#f8fafc',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {proj.projectName}{' '}
                        <span style={{ fontWeight: 500, color: '#64748b', fontSize: 12.5 }}>
                          ({proj.clientName})
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        Slug: <code>/clients/{proj.slug}/index.html</code> · Cập nhật:{' '}
                        {new Date(proj.updatedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <select
                        className="st-select"
                        style={{
                          width: 'auto',
                          padding: '4px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: statusMeta.color,
                          background: statusMeta.bg,
                        }}
                        value={proj.status}
                        onChange={(e) =>
                          onUpdateStatus(proj.id, e.target.value as ProjectStatus)
                        }
                      >
                        {(Object.keys(PROJECT_STATUS_META) as ProjectStatus[]).map((st) => (
                          <option key={st} value={st}>
                            {PROJECT_STATUS_META[st].label}
                          </option>
                        ))}
                      </select>

                      {!isCurrent && (
                        <button
                          type="button"
                          className="st-btn st-btn-sm st-btn-primary"
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                        >
                          Mở sửa
                        </button>
                      )}

                      <a
                        href={`/?mode=review&slug=${encodeURIComponent(proj.slug)}${
                          proj.reviewToken ? `&token=${encodeURIComponent(proj.reviewToken)}` : ''
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="st-btn st-btn-sm"
                        title="Mở link có Token bảo mật cho khách xem & duyệt mẫu"
                      >
                        <ExternalLink size={12} />
                        <span>Duyệt mẫu</span>
                      </a>

                      <button
                        type="button"
                        className="st-btn st-btn-sm"
                        title="Tạo phiên bản B"
                        onClick={() => onDuplicateProject(proj)}
                      >
                        <Copy size={12} />
                      </button>

                      {projects.length > 1 && (
                        <button
                          type="button"
                          className="st-btn st-btn-sm st-btn-danger"
                          title="Xóa dự án"
                          onClick={() => onDeleteProject(proj.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {activeProject && (
            <div className="st-group">
              <div className="st-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={14} />
                <span>Góp ý từ khách hàng cho "{activeProject.projectName}" ({feedback.length})</span>
              </div>
              {feedback.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#64748b' }}>
                  Chưa có góp ý nào. Hãy gửi link "Duyệt mẫu" để khách hàng xem thử trên điện thoại/máy tính và phản hồi.
                </div>
              ) : (
                feedback.map((fb) => (
                  <div key={fb.id} className="st-subcard">
                      <div className="st-subcard-head">
                        <span>
                          {fb.type === 'approved'
                            ? '✅ KHÁCH ĐÃ DUYỆT MẪU'
                            : fb.type === 'rejected'
                              ? '❌ KHÁCH YÊU CẦU SỬA (TỪ CHỐI)'
                              : `💬 ${fb.sectionLabel}`}{' '}
                          — {fb.author}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(fb.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    <div style={{ fontSize: 12.5, color: '#334155' }}>{fb.comment}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
