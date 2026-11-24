import { type ChangeEvent, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, Upload } from 'lucide-react';
import type { MenuCategory } from '../../types/spec';
import { compressImageFile } from '../../utils/imageUpload';
import { generateId } from '../../utils/storage';

interface CategoryManagerProps {
  categories: MenuCategory[];
  onChange: (next: MenuCategory[]) => void;
}

export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const normalizeOrder = (list: MenuCategory[]) =>
    list.map((c, idx) => ({ ...c, sortOrder: idx }));

  const handleAdd = () => {
    if (!newName.trim()) return;
    const created: MenuCategory = {
      id: generateId('mcat'),
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      visible: true,
      sortOrder: sorted.length,
    };
    onChange(normalizeOrder([...sorted, created]));
    setNewName('');
    setNewDesc('');
  };

  const updateCat = (id: string, patch: Partial<MenuCategory>) => {
    onChange(sorted.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const moveCat = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= sorted.length) return;
    const copy = [...sorted];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    onChange(normalizeOrder(copy));
  };

  const removeCat = (id: string) => {
    onChange(normalizeOrder(sorted.filter((c) => c.id !== id)));
  };

  const handleUploadImage = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 640, 0.8);
      updateCat(id, { imageUrl: dataUrl });
    } catch {
      // Ignore invalid image
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="st-subcard" style={{ background: '#eff6ff', borderColor: '#bfdbfe', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Thêm danh mục món mới</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            type="text"
            className="st-input"
            placeholder="Tên danh mục (VD: Cà phê đặc sản, Món nướng...)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="text"
            className="st-input"
            placeholder="Mô tả ngắn danh mục (tùy chọn)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <button
            type="button"
            className="st-btn st-btn-sm st-btn-primary"
            onClick={handleAdd}
            disabled={!newName.trim()}
          >
            <Plus size={14} />
            <span>Thêm danh mục</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {sorted.map((cat, idx) => (
          <div key={cat.id} className="st-subcard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>
                #{idx + 1} · {cat.name}
              </strong>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className="st-btn st-btn-icon"
                  disabled={idx === 0}
                  onClick={() => moveCat(idx, -1)}
                  title="Lên trên"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  className="st-btn st-btn-icon"
                  disabled={idx === sorted.length - 1}
                  onClick={() => moveCat(idx, 1)}
                  title="Xuống dưới"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  className="st-btn st-btn-icon"
                  onClick={() => updateCat(cat.id, { visible: !cat.visible })}
                  title={cat.visible ? 'Ẩn danh mục' : 'Hiện danh mục'}
                >
                  {cat.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  className="st-btn st-btn-icon st-btn-danger"
                  onClick={() => removeCat(cat.id)}
                  title="Xóa danh mục"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <input
                type="text"
                className="st-input"
                value={cat.name}
                onChange={(e) => updateCat(cat.id, { name: e.target.value })}
                placeholder="Tên danh mục"
              />
              <input
                type="text"
                className="st-input"
                value={cat.description || ''}
                onChange={(e) => updateCat(cat.id, { description: e.target.value })}
                placeholder="Mô tả danh mục"
              />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  className="st-input"
                  value={cat.imageUrl || ''}
                  onChange={(e) => updateCat(cat.id, { imageUrl: e.target.value })}
                  placeholder="Link ảnh danh mục (https://... hoặc tải lên)"
                />
                <label className="st-btn st-btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} />
                  <span>Tải ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => void handleUploadImage(cat.id, e)}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
