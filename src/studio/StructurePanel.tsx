import { useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import { getSectionLabel, SECTION_CATALOG } from '../data/templates';
import { IconRenderer } from '../renderer/IconRenderer';
import type { LandingSection, SectionType } from '../types/spec';

interface StructurePanelProps {
  sections: LandingSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onReorderSection: (fromIndex: number, toIndex: number) => void;
  onMoveSection: (id: string, delta: -1 | 1) => void;
  onToggleVisible: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onAddSection: (type: SectionType) => void;
}

function getSectionSummary(section: LandingSection): string {
  switch (section.type) {
    case 'navbar':
      return section.logoText;
    case 'hero':
      return section.headline;
    case 'stats':
      return `${section.items.length} chỉ số`;
    case 'about':
      return section.title;
    case 'products':
      return `${section.items.length} sản phẩm`;
    case 'gallery':
      return `${section.items.length} hình ảnh`;
    case 'features':
      return `${section.items.length} điểm nổi bật`;
    case 'pricing':
      return `${section.tiers.length} gói giá`;
    case 'testimonials':
      return `${section.items.length} đánh giá`;
    case 'faq':
      return `${section.items.length} câu hỏi`;
    case 'cta':
      return section.title;
    case 'contact':
      return section.email || section.phone;
    case 'footer':
      return section.brandName;
  }
}

export function StructurePanel({
  sections,
  selectedSectionId,
  onSelectSection,
  onReorderSection,
  onMoveSection,
  onToggleVisible,
  onDuplicateSection,
  onDeleteSection,
  onAddSection,
}: StructurePanelProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div className="st-group-title" style={{ margin: 0 }}>
          Cấu trúc trang ({sections.length} khối)
        </div>
        <button
          type="button"
          className="st-btn st-btn-sm st-btn-primary"
          onClick={() => setShowCatalog((prev) => !prev)}
        >
          <Plus size={14} />
          <span>{showCatalog ? 'Đóng kho khối' : 'Thêm khối'}</span>
        </button>
      </div>

      {showCatalog && (
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#1d4ed8' }}>
            Chọn khối muốn thêm vào trang:
          </div>
          <div className="st-catalog-grid">
            {SECTION_CATALOG.map((item) => (
              <button
                key={item.type}
                type="button"
                className="st-catalog-card"
                onClick={() => {
                  onAddSection(item.type);
                  setShowCatalog(false);
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconRenderer name={item.icon} size={15} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.35 }}>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="st-section-list">
        {sections.map((section, idx) => {
          const isSelected = section.id === selectedSectionId;
          const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverIdx !== idx) setDragOverIdx(idx);
              }}
              onDragLeave={() => {
                if (dragOverIdx === idx) setDragOverIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIdx !== null && draggedIdx !== idx) {
                  onReorderSection(draggedIdx, idx);
                }
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onClick={() => onSelectSection(section.id)}
              className={[
                'st-section-item',
                isSelected ? 'is-selected' : '',
                isDragOver ? 'is-drag-over' : '',
                !section.visible ? 'is-hidden-sec' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="st-drag-handle" title="Kéo để đổi vị trí">
                <GripVertical size={15} />
              </span>

              <div className="st-section-item-meta">
                <div className="st-section-item-title">{getSectionLabel(section.type)}</div>
                <div className="st-section-item-sub">{getSectionSummary(section)}</div>
              </div>

              <div className="st-mini-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="st-mini-btn"
                  title="Lên"
                  disabled={idx === 0}
                  onClick={() => onMoveSection(section.id, -1)}
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  className="st-mini-btn"
                  title="Xuống"
                  disabled={idx === sections.length - 1}
                  onClick={() => onMoveSection(section.id, 1)}
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  className="st-mini-btn"
                  title={section.visible ? 'Ẩn khối' : 'Hiện khối'}
                  onClick={() => onToggleVisible(section.id)}
                >
                  {section.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  className="st-mini-btn"
                  title="Nhân bản"
                  onClick={() => onDuplicateSection(section.id)}
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  className="st-mini-btn"
                  title="Xóa"
                  onClick={() => onDeleteSection(section.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
        Mẹo: Kéo thả các khối ở đây hoặc nhấp trực tiếp vào từng phần trên trang xem trước để sửa nội dung.
      </p>
    </div>
  );
}
