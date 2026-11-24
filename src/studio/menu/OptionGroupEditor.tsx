import { Plus, Trash2 } from 'lucide-react';
import { createPresetOptionGroup } from '../../data/digitalMenuDefaults';
import type { MenuOptionChoice, MenuOptionGroup } from '../../types/spec';
import { generateId } from '../../utils/storage';

interface OptionGroupEditorProps {
  groups: MenuOptionGroup[];
  onChange: (next: MenuOptionGroup[]) => void;
}

export function OptionGroupEditor({ groups, onChange }: OptionGroupEditorProps) {
  const addPreset = (kind: 'size' | 'sugar' | 'ice' | 'topping' | 'addons') => {
    onChange([...groups, createPresetOptionGroup(kind)]);
  };

  const addCustomGroup = () => {
    onChange([
      ...groups,
      {
        id: generateId('optg'),
        name: 'Nhóm tùy chọn mới',
        type: 'single',
        required: false,
        choices: [{ id: generateId('optc'), label: 'Lựa chọn 1', priceDelta: 0 }],
      },
    ]);
  };

  const updateGroup = (id: string, patch: Partial<MenuOptionGroup>) => {
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const removeGroup = (id: string) => {
    onChange(groups.filter((g) => g.id !== id));
  };

  const addChoice = (groupId: string) => {
    onChange(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              choices: [
                ...g.choices,
                { id: generateId('optc'), label: 'Lựa chọn mới', priceDelta: 0 },
              ],
            }
          : g
      )
    );
  };

  const updateChoice = (groupId: string, choiceId: string, patch: Partial<MenuOptionChoice>) => {
    onChange(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              choices: g.choices.map((c) => (c.id === choiceId ? { ...c, ...patch } : c)),
            }
          : g
      )
    );
  };

  const removeChoice = (groupId: string, choiceId: string) => {
    onChange(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, choices: g.choices.filter((c) => c.id !== choiceId) }
          : g
      )
    );
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        <button type="button" className="st-btn st-btn-sm" onClick={() => addPreset('size')}>
          + Size
        </button>
        <button type="button" className="st-btn st-btn-sm" onClick={() => addPreset('topping')}>
          + Topping
        </button>
        <button type="button" className="st-btn st-btn-sm" onClick={() => addPreset('sugar')}>
          + Đường
        </button>
        <button type="button" className="st-btn st-btn-sm" onClick={() => addPreset('ice')}>
          + Đá
        </button>
        <button type="button" className="st-btn st-btn-sm" onClick={() => addPreset('addons')}>
          + Thêm/bớt nguyên liệu
        </button>
        <button type="button" className="st-btn st-btn-sm st-btn-primary" onClick={addCustomGroup}>
          <Plus size={12} />
          <span>Nhóm tự tạo</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
          Chưa có nhóm tùy chọn (Size, Topping, Đường, Đá...). Bấm nút trên để thêm nhanh.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {groups.map((group) => (
            <div key={group.id} className="st-subcard" style={{ background: '#ffffff' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="text"
                  className="st-input"
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  placeholder="Tên nhóm (VD: Size, Topping)"
                />
                <select
                  className="st-select"
                  style={{ width: 120 }}
                  value={group.type}
                  onChange={(e) =>
                    updateGroup(group.id, {
                      type: e.target.value === 'multiple' ? 'multiple' : 'single',
                    })
                  }
                >
                  <option value="single">Chọn 1</option>
                  <option value="multiple">Chọn nhiều</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={(e) => updateGroup(group.id, { required: e.target.checked })}
                  />
                  <span>Bắt buộc</span>
                </label>
                <button
                  type="button"
                  className="st-btn st-btn-icon st-btn-danger"
                  onClick={() => removeGroup(group.id)}
                  title="Xóa nhóm"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: 5 }}>
                {group.choices.map((choice) => (
                  <div key={choice.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="text"
                      className="st-input"
                      value={choice.label}
                      onChange={(e) =>
                        updateChoice(group.id, choice.id, { label: e.target.value })
                      }
                      placeholder="Tên lựa chọn"
                    />
                    <input
                      type="number"
                      className="st-input"
                      style={{ width: 110 }}
                      value={choice.priceDelta}
                      onChange={(e) =>
                        updateChoice(group.id, choice.id, {
                          priceDelta: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="Phụ thu"
                      title="Giá phụ thu (đ)"
                    />
                    <button
                      type="button"
                      className="st-btn st-btn-icon"
                      onClick={() => removeChoice(group.id, choice.id)}
                      title="Xóa lựa chọn"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  style={{ justifySelf: 'start' }}
                  onClick={() => addChoice(group.id)}
                >
                  <Plus size={12} />
                  <span>Thêm lựa chọn</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
