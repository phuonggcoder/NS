import { type ChangeEvent, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { COMMON_ALLERGENS, formatMenuPrice } from '../../data/digitalMenuDefaults';
import { PLACEHOLDER_ART } from '../../data/placeholders';
import type { MenuCategory, MenuItem } from '../../types/spec';
import { compressImageFile } from '../../utils/imageUpload';
import { generateId } from '../../utils/storage';
import { OptionGroupEditor } from './OptionGroupEditor';

interface MenuItemEditorProps {
  categories: MenuCategory[];
  items: MenuItem[];
  currency: string;
  onChange: (next: MenuItem[]) => void;
}

export function MenuItemEditor({
  categories,
  items,
  currency,
  onChange,
}: MenuItemEditorProps) {
  const [filterCat, setFilterCat] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(items[0]?.id ?? null);

  const sortedCategories = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const filteredItems = items.filter((it) => filterCat === 'all' || it.categoryId === filterCat);
  const editingItem = items.find((it) => it.id === editingId) ?? null;

  const handleAddItem = () => {
    const defaultCat = filterCat !== 'all' ? filterCat : sortedCategories[0]?.id || '';
    const created: MenuItem = {
      id: generateId('mitem'),
      categoryId: defaultCat,
      name: 'Món mới',
      description: 'Mô tả ngắn hấp dẫn về hương vị và nguyên liệu.',
      imageUrl: PLACEHOLDER_ART.productCoffee1,
      price: 45000,
      status: 'available',
      featured: false,
      bestSeller: false,
      ingredients: '',
      allergens: [],
      optionGroups: [],
      sortOrder: items.length,
    };
    onChange([...items, created]);
    setEditingId(created.id);
  };

  const updateItem = (id: string, patch: Partial<MenuItem>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const deleteItem = (id: string) => {
    const remaining = items.filter((it) => it.id !== id);
    onChange(remaining);
    if (editingId === id) {
      setEditingId(remaining[0]?.id ?? null);
    }
  };

  const handleUploadImage = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 900, 0.82);
      updateItem(id, { imageUrl: dataUrl });
    } catch {
      // Ignore invalid image
    } finally {
      e.target.value = '';
    }
  };

  const toggleAllergen = (item: MenuItem, allergen: string) => {
    const current = item.allergens || [];
    const next = current.includes(allergen)
      ? current.filter((a) => a !== allergen)
      : [...current, allergen];
    updateItem(item.id, { allergens: next });
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="st-select"
          style={{ flex: 1, minWidth: 160 }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="all">Tất cả danh mục ({items.length})</option>
          {sortedCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({items.filter((i) => i.categoryId === c.id).length})
            </option>
          ))}
        </select>

        <button type="button" className="st-btn st-btn-sm st-btn-primary" onClick={handleAddItem}>
          <Plus size={14} />
          <span>Thêm món mới</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filteredItems.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`st-btn st-btn-sm ${editingId === it.id ? 'st-btn-primary' : ''}`}
            onClick={() => setEditingId(it.id)}
          >
            <span>{it.name}</span>
            <span style={{ opacity: 0.78, fontSize: 11 }}>
              ({formatMenuPrice(it.salePrice || it.price, currency)})
            </span>
          </button>
        ))}
      </div>

      {editingItem ? (
        <div className="st-subcard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13.5 }}>Chỉnh sửa: {editingItem.name}</strong>
            <button
              type="button"
              className="st-btn st-btn-sm st-btn-danger"
              onClick={() => deleteItem(editingItem.id)}
            >
              <Trash2 size={13} />
              <span>Xóa món</span>
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="st-field" style={{ marginBottom: 0 }}>
                <label className="st-label">Tên món *</label>
                <input
                  type="text"
                  className="st-input"
                  value={editingItem.name}
                  onChange={(e) => updateItem(editingItem.id, { name: e.target.value })}
                />
              </div>
              <div className="st-field" style={{ marginBottom: 0 }}>
                <label className="st-label">Danh mục</label>
                <select
                  className="st-select"
                  value={editingItem.categoryId}
                  onChange={(e) => updateItem(editingItem.id, { categoryId: e.target.value })}
                >
                  {sortedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="st-field" style={{ marginBottom: 0 }}>
              <label className="st-label">Mô tả món ăn</label>
              <textarea
                rows={2}
                className="st-textarea"
                value={editingItem.description}
                onChange={(e) => updateItem(editingItem.id, { description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label className="st-label">Giá bán ({currency})</label>
                <input
                  type="number"
                  className="st-input"
                  value={editingItem.price}
                  onChange={(e) =>
                    updateItem(editingItem.id, { price: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
              <div>
                <label className="st-label">Giá khuyến mãi (tùy chọn)</label>
                <input
                  type="number"
                  className="st-input"
                  value={editingItem.salePrice ?? ''}
                  placeholder="Để trống nếu không giảm"
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    updateItem(editingItem.id, {
                      salePrice: val ? Math.max(0, Number(val) || 0) : undefined,
                    });
                  }}
                />
              </div>
              <div>
                <label className="st-label">Trạng thái bán</label>
                <select
                  className="st-select"
                  value={editingItem.status}
                  onChange={(e) =>
                    updateItem(editingItem.id, {
                      status: e.target.value === 'sold_out' ? 'sold_out' : 'available',
                    })
                  }
                >
                  <option value="available">Đang bán</option>
                  <option value="sold_out">Tạm hết</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                <input
                  type="checkbox"
                  checked={Boolean(editingItem.bestSeller)}
                  onChange={(e) => updateItem(editingItem.id, { bestSeller: e.target.checked })}
                />
                <span>Nhãn Best Seller</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                <input
                  type="checkbox"
                  checked={Boolean(editingItem.featured)}
                  onChange={(e) => updateItem(editingItem.id, { featured: e.target.checked })}
                />
                <span>Món nổi bật</span>
              </label>
            </div>

            <div>
              <label className="st-label">Hình ảnh món</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  className="st-input"
                  value={editingItem.imageUrl}
                  onChange={(e) => updateItem(editingItem.id, { imageUrl: e.target.value })}
                />
                <label className="st-btn st-btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} />
                  <span>Tải ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => void handleUploadImage(editingItem.id, e)}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="st-label">Thành phần nguyên liệu</label>
              <input
                type="text"
                className="st-input"
                value={editingItem.ingredients || ''}
                placeholder="VD: Trà Oolong, sữa tươi thanh trùng, trân châu..."
                onChange={(e) => updateItem(editingItem.id, { ingredients: e.target.value })}
              />
            </div>

            <div>
              <label className="st-label">Cảnh báo dị ứng (Allergens)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COMMON_ALLERGENS.map((alg) => {
                  const checked = (editingItem.allergens || []).includes(alg);
                  return (
                    <button
                      key={alg}
                      type="button"
                      className={`st-pill-opt ${checked ? 'is-active' : ''}`}
                      style={{ fontSize: 11.5 }}
                      onClick={() => toggleAllergen(editingItem, alg)}
                    >
                      {alg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
              <strong style={{ fontSize: 13 }}>Tùy chỉnh món (Size, Topping, Đường, Đá...)</strong>
              <OptionGroupEditor
                groups={editingItem.optionGroups || []}
                onChange={(optionGroups) => updateItem(editingItem.id, { optionGroups })}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="st-subcard" style={{ textAlign: 'center', color: '#64748b' }}>
          Chưa có món nào. Hãy bấm "Thêm món mới" để bắt đầu tạo thực đơn.
        </div>
      )}
    </div>
  );
}
