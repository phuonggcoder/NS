import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { PLACEHOLDER_ART } from '../../data/placeholders';
import { getSectionLabel } from '../../data/templates';
import { AVAILABLE_ICON_OPTIONS } from '../../renderer/IconRenderer';
import type {
  LandingSection,
  SectionMaxWidth,
  SectionPadding,
  SectionSurface,
} from '../../types/spec';
import { pickReadableText } from '../../utils/contrast';
import { generateId } from '../../utils/storage';
import {
  ImageField,
  StringListEditor,
  TextAreaField,
  TextField,
  VariantSelector,
} from './FieldPrimitives';

interface SectionInspectorProps {
  section: LandingSection | null;
  onUpdateSection: (updated: LandingSection) => void;
  onDeleteSection: (id: string) => void;
}

export function SectionInspector({
  section,
  onUpdateSection,
  onDeleteSection,
}: SectionInspectorProps) {
  if (!section) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        Hãy nhấp vào một khối trên trang xem trước hoặc ở danh sách bên trái để tùy chỉnh nội dung.
      </div>
    );
  }

  const updateStyle = (patch: Partial<LandingSection['style']>) => {
    onUpdateSection({
      ...section,
      style: { ...section.style, ...patch },
    } as LandingSection);
  };

  const renderSectionSpecific = () => {
    switch (section.type) {
      case 'navbar':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Kiểu & Thương hiệu</div>
              <VariantSelector
                label="Phong cách thanh điều hướng"
                value={section.variant}
                options={[
                  { value: 'glass', label: 'Kính mờ' },
                  { value: 'solid', label: 'Nền đặc' },
                  { value: 'floating', label: 'Thanh nổi' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Tên thương hiệu / Cá nhân"
                value={section.logoText}
                onChange={(logoText) => onUpdateSection({ ...section, logoText })}
              />
              <TextField
                label="Icon Logo (Emoji)"
                value={section.logoEmoji}
                onChange={(logoEmoji) => onUpdateSection({ ...section, logoEmoji })}
              />
              <TextField
                label="Chữ nút hành động (CTA)"
                value={section.ctaLabel}
                onChange={(ctaLabel) => onUpdateSection({ ...section, ctaLabel })}
              />
              <TextField
                label="Liên kết nút CTA"
                value={section.ctaHref}
                onChange={(ctaHref) => onUpdateSection({ ...section, ctaHref })}
              />
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Menu Liên kết ({section.links.length})
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      links: [
                        ...section.links,
                        { id: generateId('nl'), label: 'Mục mới', href: '#products' },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm link
                </button>
              </div>
              {section.links.map((link, idx) => (
                <div key={link.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>Link #{idx + 1}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          links: section.links.filter((l) => l.id !== link.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Nhãn"
                    value={link.label}
                    onChange={(label) => {
                      const next = [...section.links];
                      next[idx] = { ...link, label };
                      onUpdateSection({ ...section, links: next });
                    }}
                  />
                  <TextField
                    label="Đường dẫn (#id hoặc https://)"
                    value={link.href}
                    onChange={(href) => {
                      const next = [...section.links];
                      next[idx] = { ...link, href };
                      onUpdateSection({ ...section, links: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'hero':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Bố cục Hero</div>
              <VariantSelector
                label="Kiểu hiển thị"
                value={section.variant}
                options={[
                  { value: 'split-right', label: 'Ảnh bên phải' },
                  { value: 'split-left', label: 'Ảnh bên trái' },
                  { value: 'centered', label: 'Căn giữa' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Nhãn nhỏ (Badge)"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextAreaField
                label="Tiêu đề chính"
                rows={2}
                value={section.headline}
                onChange={(headline) => onUpdateSection({ ...section, headline })}
              />
              <TextField
                label="Cụm chữ nhấn màu Gradient"
                value={section.highlightText}
                onChange={(highlightText) => onUpdateSection({ ...section, highlightText })}
              />
              <TextAreaField
                label="Mô tả ngắn dưới tiêu đề"
                rows={3}
                value={section.subheadline}
                onChange={(subheadline) => onUpdateSection({ ...section, subheadline })}
              />
            </div>

            <div className="st-group">
              <div className="st-group-title">Nút bấm & Hình ảnh</div>
              <TextField
                label="Nút chính"
                value={section.primaryCtaLabel}
                onChange={(primaryCtaLabel) => onUpdateSection({ ...section, primaryCtaLabel })}
              />
              <TextField
                label="Link nút chính"
                value={section.primaryCtaHref}
                onChange={(primaryCtaHref) => onUpdateSection({ ...section, primaryCtaHref })}
              />
              <TextField
                label="Nút phụ"
                value={section.secondaryCtaLabel}
                onChange={(secondaryCtaLabel) =>
                  onUpdateSection({ ...section, secondaryCtaLabel })
                }
              />
              <TextField
                label="Link nút phụ"
                value={section.secondaryCtaHref}
                onChange={(secondaryCtaHref) => onUpdateSection({ ...section, secondaryCtaHref })}
              />
              <ImageField
                label="Ảnh / Banner minh họa"
                value={section.imageUrl}
                onChange={(imageUrl) => onUpdateSection({ ...section, imageUrl })}
              />
              <TextField
                label="Chú thích dưới ảnh"
                value={section.imageCaption}
                onChange={(imageCaption) => onUpdateSection({ ...section, imageCaption })}
              />
              <StringListEditor
                label="Cam kết ngắn (Trust chips)"
                items={section.trustChips}
                onChange={(trustChips) => onUpdateSection({ ...section, trustChips })}
              />
            </div>
          </>
        );

      case 'stats':
        return (
          <div className="st-group">
            <div className="st-group-title">Kiểu & Chỉ số</div>
            <VariantSelector
              label="Hiển thị"
              value={section.variant}
              options={[
                { value: 'strip', label: 'Dải gọn' },
                { value: 'cards', label: 'Thẻ nổi' },
              ]}
              onChange={(variant) => onUpdateSection({ ...section, variant })}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="st-label">Danh sách chỉ số ({section.items.length})</span>
              <button
                type="button"
                className="st-btn st-btn-sm"
                onClick={() =>
                  onUpdateSection({
                    ...section,
                    items: [
                      ...section.items,
                      { id: generateId('st'), value: '100%', label: 'Hài lòng', note: 'Cam kết' },
                    ],
                  })
                }
              >
                <Plus size={12} /> Thêm chỉ số
              </button>
            </div>
            {section.items.map((item, idx) => (
              <div key={item.id} className="st-subcard">
                <div className="st-subcard-head">
                  <span>Chỉ số #{idx + 1}</span>
                  <button
                    type="button"
                    className="st-mini-btn"
                    onClick={() =>
                      onUpdateSection({
                        ...section,
                        items: section.items.filter((i) => i.id !== item.id),
                      })
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <TextField
                  label="Con số"
                  value={item.value}
                  onChange={(value) => {
                    const next = [...section.items];
                    next[idx] = { ...item, value };
                    onUpdateSection({ ...section, items: next });
                  }}
                />
                <TextField
                  label="Nhãn"
                  value={item.label}
                  onChange={(label) => {
                    const next = [...section.items];
                    next[idx] = { ...item, label };
                    onUpdateSection({ ...section, items: next });
                  }}
                />
                <TextField
                  label="Ghi chú nhỏ"
                  value={item.note || ''}
                  onChange={(note) => {
                    const next = [...section.items];
                    next[idx] = { ...item, note };
                    onUpdateSection({ ...section, items: next });
                  }}
                />
              </div>
            ))}
          </div>
        );

      case 'about':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Thông tin Cá nhân / Thương hiệu</div>
              <VariantSelector
                label="Bố cục giới thiệu"
                value={section.variant}
                options={[
                  { value: 'split-left', label: 'Ảnh trái' },
                  { value: 'split-right', label: 'Ảnh phải' },
                  { value: 'centered-card', label: 'Thẻ giữa' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Badge"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextField
                label="Tiêu đề / Tên của bạn"
                value={section.title}
                onChange={(title) => onUpdateSection({ ...section, title })}
              />
              <TextField
                label="Chức danh / Vai trò"
                value={section.role}
                onChange={(role) => onUpdateSection({ ...section, role })}
              />
              <TextAreaField
                label="Câu chuyện / Tiểu sử"
                rows={4}
                value={section.bio}
                onChange={(bio) => onUpdateSection({ ...section, bio })}
              />
              <ImageField
                label="Ảnh chân dung"
                value={section.avatarUrl}
                onChange={(avatarUrl) => onUpdateSection({ ...section, avatarUrl })}
              />
              <StringListEditor
                label="Kỹ năng / Thế mạnh"
                items={section.highlights}
                onChange={(highlights) => onUpdateSection({ ...section, highlights })}
              />
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Cột mốc kinh nghiệm
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      milestones: [
                        ...section.milestones,
                        {
                          id: generateId('ms'),
                          year: '2026',
                          title: 'Cột mốc mới',
                          detail: 'Thành tựu nổi bật',
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm
                </button>
              </div>
              {section.milestones.map((m, idx) => (
                <div key={m.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>Cột mốc #{idx + 1}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          milestones: section.milestones.filter((x) => x.id !== m.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Thời gian"
                    value={m.year}
                    onChange={(year) => {
                      const next = [...section.milestones];
                      next[idx] = { ...m, year };
                      onUpdateSection({ ...section, milestones: next });
                    }}
                  />
                  <TextField
                    label="Tiêu đề"
                    value={m.title}
                    onChange={(title) => {
                      const next = [...section.milestones];
                      next[idx] = { ...m, title };
                      onUpdateSection({ ...section, milestones: next });
                    }}
                  />
                  <TextAreaField
                    label="Mô tả"
                    rows={2}
                    value={m.detail}
                    onChange={(detail) => {
                      const next = [...section.milestones];
                      next[idx] = { ...m, detail };
                      onUpdateSection({ ...section, milestones: next });
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Mạng xã hội
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      socials: [
                        ...section.socials,
                        { id: generateId('soc'), label: 'Website', href: 'https://example.com' },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm
                </button>
              </div>
              {section.socials.map((soc, idx) => (
                <div key={soc.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>{soc.label}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          socials: section.socials.filter((x) => x.id !== soc.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Tên kênh"
                    value={soc.label}
                    onChange={(label) => {
                      const next = [...section.socials];
                      next[idx] = { ...soc, label };
                      onUpdateSection({ ...section, socials: next });
                    }}
                  />
                  <TextField
                    label="Liên kết"
                    value={soc.href}
                    onChange={(href) => {
                      const next = [...section.socials];
                      next[idx] = { ...soc, href };
                      onUpdateSection({ ...section, socials: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'products':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Cài đặt Khối Sản phẩm</div>
              <VariantSelector
                label="Bố cục hiển thị"
                value={section.variant}
                options={[
                  { value: 'grid-3', label: 'Lưới 3 cột' },
                  { value: 'grid-2', label: 'Lưới 2 cột' },
                  { value: 'spotlight', label: 'Ngang chi tiết' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <VariantSelector
                label="Hành động khi khách bấm Mua"
                value={section.orderChannel}
                options={[
                  { value: 'modal', label: 'Mở Form Đặt hàng' },
                  { value: 'zalo', label: 'Form + Gợi ý Zalo' },
                  { value: 'link', label: 'Chuyển tới Link riêng' },
                ]}
                onChange={(orderChannel) => onUpdateSection({ ...section, orderChannel })}
              />
              <TextField
                label="Badge"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextField
                label="Tiêu đề khối sản phẩm"
                value={section.title}
                onChange={(title) => onUpdateSection({ ...section, title })}
              />
              <TextAreaField
                label="Mô tả ngắn"
                rows={2}
                value={section.subtitle}
                onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
              />
              <TextField
                label="Đơn vị tiền tệ"
                value={section.currency}
                onChange={(currency) => onUpdateSection({ ...section, currency })}
              />
              {section.orderChannel !== 'modal' && (
                <TextField
                  label="Link Zalo / Thanh toán mặc định"
                  value={section.orderChannelHref || ''}
                  onChange={(orderChannelHref) =>
                    onUpdateSection({ ...section, orderChannelHref })
                  }
                />
              )}
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Danh sách Sản phẩm ({section.items.length})
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm st-btn-primary"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      items: [
                        ...section.items,
                        {
                          id: generateId('prd'),
                          name: 'Sản phẩm mới',
                          badge: 'Mới',
                          price: '590.000đ',
                          originalPrice: '790.000đ',
                          description: 'Mô tả ngắn gọn giá trị sản phẩm mang lại cho khách hàng.',
                          imageUrl: PLACEHOLDER_ART.productUiKit,
                          features: ['Đặc điểm nổi bật 1', 'Bảo hành & hỗ trợ'],
                          ctaLabel: 'Mua ngay',
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm SP
                </button>
              </div>

              {section.items.map((prd, idx) => (
                <div key={prd.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>
                      SP #{idx + 1}: {prd.name}
                    </span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      title="Xóa sản phẩm"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          items: section.items.filter((x) => x.id !== prd.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Tên sản phẩm"
                    value={prd.name}
                    onChange={(name) => {
                      const next = [...section.items];
                      next[idx] = { ...prd, name };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <TextField
                      label="Giá bán"
                      value={prd.price}
                      onChange={(price) => {
                        const next = [...section.items];
                        next[idx] = { ...prd, price };
                        onUpdateSection({ ...section, items: next });
                      }}
                    />
                    <TextField
                      label="Giá gốc (gạch ngang)"
                      value={prd.originalPrice || ''}
                      onChange={(originalPrice) => {
                        const next = [...section.items];
                        next[idx] = { ...prd, originalPrice };
                        onUpdateSection({ ...section, items: next });
                      }}
                    />
                  </div>
                  <TextField
                    label="Nhãn nổi bật (VD: Bán chạy)"
                    value={prd.badge || ''}
                    onChange={(badge) => {
                      const next = [...section.items];
                      next[idx] = { ...prd, badge };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextAreaField
                    label="Mô tả"
                    rows={2}
                    value={prd.description}
                    onChange={(description) => {
                      const next = [...section.items];
                      next[idx] = { ...prd, description };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <ImageField
                    label="Ảnh sản phẩm"
                    value={prd.imageUrl}
                    onChange={(imageUrl) => {
                      const next = [...section.items];
                      next[idx] = { ...prd, imageUrl };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <StringListEditor
                    label="Quyền lợi / Điểm mạnh"
                    items={prd.features}
                    onChange={(features) => {
                      const next = [...section.items];
                      next[idx] = { ...prd, features };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextField
                    label="Chữ trên nút Mua"
                    value={prd.ctaLabel}
                    onChange={(ctaLabel) => {
                      const next = [...section.items];
                      next[idx] = { ...prd, ctaLabel };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  {section.orderChannel === 'link' && (
                    <TextField
                      label="Link mua sản phẩm riêng"
                      value={prd.href || ''}
                      onChange={(href) => {
                        const next = [...section.items];
                        next[idx] = { ...prd, href };
                        onUpdateSection({ ...section, items: next });
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        );

      case 'gallery':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Thư viện Ảnh / Dự án</div>
              <VariantSelector
                label="Bố cục hiển thị"
                value={section.variant}
                options={[
                  { value: 'grid-3', label: '3 cột' },
                  { value: 'grid-2', label: '2 cột' },
                  { value: 'showcase', label: 'Nổi bật đầu' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Badge"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextField
                label="Tiêu đề"
                value={section.title}
                onChange={(title) => onUpdateSection({ ...section, title })}
              />
              <TextAreaField
                label="Mô tả ngắn"
                rows={2}
                value={section.subtitle}
                onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
              />
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Hình ảnh ({section.items.length})
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      items: [
                        ...section.items,
                        {
                          id: generateId('gal'),
                          title: 'Hình ảnh / Dự án mới',
                          category: 'Sản phẩm',
                          imageUrl: PLACEHOLDER_ART.heroCreator,
                          caption: 'Mô tả ngắn về hình ảnh hoặc kết quả đạt được.',
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm ảnh
                </button>
              </div>
              {section.items.map((item, idx) => (
                <div key={item.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>Ảnh #{idx + 1}: {item.title}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          items: section.items.filter((x) => x.id !== item.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Tiêu đề"
                    value={item.title}
                    onChange={(title) => {
                      const next = [...section.items];
                      next[idx] = { ...item, title };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextField
                    label="Phân loại"
                    value={item.category}
                    onChange={(category) => {
                      const next = [...section.items];
                      next[idx] = { ...item, category };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <ImageField
                    label="Hình ảnh"
                    value={item.imageUrl}
                    onChange={(imageUrl) => {
                      const next = [...section.items];
                      next[idx] = { ...item, imageUrl };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextAreaField
                    label="Chú thích"
                    rows={2}
                    value={item.caption}
                    onChange={(caption) => {
                      const next = [...section.items];
                      next[idx] = { ...item, caption };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'features':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Khối Tính năng / Lợi ích</div>
              <VariantSelector
                label="Bố cục"
                value={section.variant}
                options={[
                  { value: 'grid-3', label: '3 cột' },
                  { value: 'grid-2', label: '2 cột' },
                  { value: 'bento', label: 'Bento' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Badge"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextField
                label="Tiêu đề"
                value={section.title}
                onChange={(title) => onUpdateSection({ ...section, title })}
              />
              <TextAreaField
                label="Mô tả"
                rows={2}
                value={section.subtitle}
                onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
              />
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Các mục ({section.items.length})
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      items: [
                        ...section.items,
                        {
                          id: generateId('ft'),
                          icon: 'sparkles',
                          title: 'Điểm nổi bật mới',
                          description: 'Mô tả lợi ích rõ ràng cho khách hàng.',
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm
                </button>
              </div>
              {section.items.map((item, idx) => (
                <div key={item.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>Mục #{idx + 1}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          items: section.items.filter((x) => x.id !== item.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="st-field">
                    <label className="st-label">Biểu tượng (Icon)</label>
                    <select
                      className="st-select"
                      value={item.icon}
                      onChange={(e) => {
                        const next = [...section.items];
                        next[idx] = { ...item, icon: e.target.value };
                        onUpdateSection({ ...section, items: next });
                      }}
                    >
                      {AVAILABLE_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <TextField
                    label="Tiêu đề"
                    value={item.title}
                    onChange={(title) => {
                      const next = [...section.items];
                      next[idx] = { ...item, title };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextAreaField
                    label="Nội dung"
                    rows={2}
                    value={item.description}
                    onChange={(description) => {
                      const next = [...section.items];
                      next[idx] = { ...item, description };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'pricing':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Bảng giá</div>
              <VariantSelector
                label="Bố cục"
                value={section.variant}
                options={[
                  { value: 'columns', label: 'Các cột' },
                  { value: 'compact', label: '2 cột gọn' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Badge"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextField
                label="Tiêu đề"
                value={section.title}
                onChange={(title) => onUpdateSection({ ...section, title })}
              />
              <TextAreaField
                label="Mô tả"
                rows={2}
                value={section.subtitle}
                onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
              />
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Các gói ({section.tiers.length})
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      tiers: [
                        ...section.tiers,
                        {
                          id: generateId('tier'),
                          name: 'Gói mới',
                          price: '990.000đ',
                          period: '/ trọn đời',
                          description: 'Mô tả ngắn về gói dịch vụ',
                          features: ['Tính năng 1', 'Tính năng 2'],
                          highlighted: false,
                          ctaLabel: 'Chọn gói này',
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm gói
                </button>
              </div>
              {section.tiers.map((tier, idx) => (
                <div key={tier.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>{tier.name}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          tiers: section.tiers.filter((x) => x.id !== tier.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Tên gói"
                    value={tier.name}
                    onChange={(name) => {
                      const next = [...section.tiers];
                      next[idx] = { ...tier, name };
                      onUpdateSection({ ...section, tiers: next });
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <TextField
                      label="Giá"
                      value={tier.price}
                      onChange={(price) => {
                        const next = [...section.tiers];
                        next[idx] = { ...tier, price };
                        onUpdateSection({ ...section, tiers: next });
                      }}
                    />
                    <TextField
                      label="Chu kỳ"
                      value={tier.period}
                      onChange={(period) => {
                        const next = [...section.tiers];
                        next[idx] = { ...tier, period };
                        onUpdateSection({ ...section, tiers: next });
                      }}
                    />
                  </div>
                  <TextField
                    label="Nhãn nổi bật"
                    value={tier.badge || ''}
                    onChange={(badge) => {
                      const next = [...section.tiers];
                      next[idx] = { ...tier, badge };
                      onUpdateSection({ ...section, tiers: next });
                    }}
                  />
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 10,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tier.highlighted}
                      onChange={(e) => {
                        const next = [...section.tiers];
                        next[idx] = { ...tier, highlighted: e.target.checked };
                        onUpdateSection({ ...section, tiers: next });
                      }}
                    />
                    <span>Làm nổi bật gói này</span>
                  </label>
                  <TextAreaField
                    label="Mô tả"
                    rows={2}
                    value={tier.description}
                    onChange={(description) => {
                      const next = [...section.tiers];
                      next[idx] = { ...tier, description };
                      onUpdateSection({ ...section, tiers: next });
                    }}
                  />
                  <StringListEditor
                    label="Quyền lợi trong gói"
                    items={tier.features}
                    onChange={(features) => {
                      const next = [...section.tiers];
                      next[idx] = { ...tier, features };
                      onUpdateSection({ ...section, tiers: next });
                    }}
                  />
                  <TextField
                    label="Chữ trên nút"
                    value={tier.ctaLabel}
                    onChange={(ctaLabel) => {
                      const next = [...section.tiers];
                      next[idx] = { ...tier, ctaLabel };
                      onUpdateSection({ ...section, tiers: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'testimonials':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Đánh giá Khách hàng</div>
              <VariantSelector
                label="Bố cục"
                value={section.variant}
                options={[
                  { value: 'grid', label: '3 cột' },
                  { value: 'spotlight', label: '2 cột lớn' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Badge"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextField
                label="Tiêu đề"
                value={section.title}
                onChange={(title) => onUpdateSection({ ...section, title })}
              />
              <TextAreaField
                label="Mô tả"
                rows={2}
                value={section.subtitle}
                onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
              />
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Phản hồi ({section.items.length})
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      items: [
                        ...section.items,
                        {
                          id: generateId('tm'),
                          name: 'Khách hàng mới',
                          role: 'Chủ doanh nghiệp',
                          quote: 'Trải nghiệm tuyệt vời, sản phẩm vượt mong đợi.',
                          rating: 5,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm
                </button>
              </div>
              {section.items.map((item, idx) => (
                <div key={item.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>{item.name}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          items: section.items.filter((x) => x.id !== item.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Tên khách hàng"
                    value={item.name}
                    onChange={(name) => {
                      const next = [...section.items];
                      next[idx] = { ...item, name };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextField
                    label="Chức vụ / Công ty"
                    value={item.role}
                    onChange={(role) => {
                      const next = [...section.items];
                      next[idx] = { ...item, role };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextAreaField
                    label="Lời nhận xét"
                    rows={2}
                    value={item.quote}
                    onChange={(quote) => {
                      const next = [...section.items];
                      next[idx] = { ...item, quote };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'faq':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Câu hỏi Thường gặp</div>
              <VariantSelector
                label="Bố cục"
                value={section.variant}
                options={[
                  { value: 'accordion', label: 'Đóng mở' },
                  { value: 'two-column', label: '2 cột thẻ' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Badge"
                value={section.badge}
                onChange={(badge) => onUpdateSection({ ...section, badge })}
              />
              <TextField
                label="Tiêu đề"
                value={section.title}
                onChange={(title) => onUpdateSection({ ...section, title })}
              />
              <TextAreaField
                label="Mô tả"
                rows={2}
                value={section.subtitle}
                onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
              />
            </div>

            <div className="st-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="st-group-title" style={{ margin: 0 }}>
                  Danh sách Câu hỏi ({section.items.length})
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() =>
                    onUpdateSection({
                      ...section,
                      items: [
                        ...section.items,
                        {
                          id: generateId('fq'),
                          question: 'Câu hỏi mới?',
                          answer: 'Câu trả lời chi tiết cho khách hàng.',
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} /> Thêm
                </button>
              </div>
              {section.items.map((item, idx) => (
                <div key={item.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>Câu hỏi #{idx + 1}</span>
                    <button
                      type="button"
                      className="st-mini-btn"
                      onClick={() =>
                        onUpdateSection({
                          ...section,
                          items: section.items.filter((x) => x.id !== item.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Câu hỏi"
                    value={item.question}
                    onChange={(question) => {
                      const next = [...section.items];
                      next[idx] = { ...item, question };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                  <TextAreaField
                    label="Trả lời"
                    rows={3}
                    value={item.answer}
                    onChange={(answer) => {
                      const next = [...section.items];
                      next[idx] = { ...item, answer };
                      onUpdateSection({ ...section, items: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'cta':
        return (
          <div className="st-group">
            <div className="st-group-title">Khối Kêu gọi Hành động (CTA)</div>
            <VariantSelector
              label="Phong cách"
              value={section.variant}
              options={[
                { value: 'gradient-card', label: 'Thẻ Gradient' },
                { value: 'minimal-band', label: 'Tối giản' },
              ]}
              onChange={(variant) => onUpdateSection({ ...section, variant })}
            />
            <TextField
              label="Badge"
              value={section.badge}
              onChange={(badge) => onUpdateSection({ ...section, badge })}
            />
            <TextAreaField
              label="Tiêu đề"
              rows={2}
              value={section.title}
              onChange={(title) => onUpdateSection({ ...section, title })}
            />
            <TextAreaField
              label="Mô tả"
              rows={2}
              value={section.subtitle}
              onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
            />
            <TextField
              label="Nút chính"
              value={section.primaryLabel}
              onChange={(primaryLabel) => onUpdateSection({ ...section, primaryLabel })}
            />
            <TextField
              label="Link nút chính"
              value={section.primaryHref}
              onChange={(primaryHref) => onUpdateSection({ ...section, primaryHref })}
            />
            <TextField
              label="Nút phụ"
              value={section.secondaryLabel}
              onChange={(secondaryLabel) => onUpdateSection({ ...section, secondaryLabel })}
            />
            <TextField
              label="Link nút phụ"
              value={section.secondaryHref}
              onChange={(secondaryHref) => onUpdateSection({ ...section, secondaryHref })}
            />
          </div>
        );

      case 'contact':
        return (
          <div className="st-group">
            <div className="st-group-title">Thông tin Liên hệ & Form</div>
            <VariantSelector
              label="Bố cục"
              value={section.variant}
              options={[
                { value: 'split', label: 'Chia 2 cột' },
                { value: 'centered', label: 'Form giữa' },
              ]}
              onChange={(variant) => onUpdateSection({ ...section, variant })}
            />
            <TextField
              label="Badge"
              value={section.badge}
              onChange={(badge) => onUpdateSection({ ...section, badge })}
            />
            <TextField
              label="Tiêu đề"
              value={section.title}
              onChange={(title) => onUpdateSection({ ...section, title })}
            />
            <TextAreaField
              label="Mô tả"
              rows={2}
              value={section.subtitle}
              onChange={(subtitle) => onUpdateSection({ ...section, subtitle })}
            />
            <TextField
              label="Số điện thoại"
              value={section.phone}
              onChange={(phone) => onUpdateSection({ ...section, phone })}
            />
            <TextField
              label="Email"
              value={section.email}
              onChange={(email) => onUpdateSection({ ...section, email })}
            />
            <TextField
              label="Địa chỉ"
              value={section.address}
              onChange={(address) => onUpdateSection({ ...section, address })}
            />
            <TextField
              label="Chữ nút Zalo"
              value={section.zaloLabel}
              onChange={(zaloLabel) => onUpdateSection({ ...section, zaloLabel })}
            />
            <TextField
              label="Link Zalo"
              value={section.zaloHref}
              onChange={(zaloHref) => onUpdateSection({ ...section, zaloHref })}
            />
            <TextField
              label="Chữ nút gửi Form"
              value={section.formSubmitLabel}
              onChange={(formSubmitLabel) => onUpdateSection({ ...section, formSubmitLabel })}
            />
            <TextAreaField
              label="Thông báo khi gửi thành công"
              rows={2}
              value={section.successMessage}
              onChange={(successMessage) => onUpdateSection({ ...section, successMessage })}
            />
          </div>
        );

      case 'footer':
        return (
          <>
            <div className="st-group">
              <div className="st-group-title">Chân trang (Footer)</div>
              <VariantSelector
                label="Kiểu chân trang"
                value={section.variant}
                options={[
                  { value: 'columns', label: 'Nhiều cột' },
                  { value: 'minimal', label: 'Tối giản' },
                ]}
                onChange={(variant) => onUpdateSection({ ...section, variant })}
              />
              <TextField
                label="Tên thương hiệu"
                value={section.brandName}
                onChange={(brandName) => onUpdateSection({ ...section, brandName })}
              />
              <TextAreaField
                label="Mô tả thương hiệu"
                rows={2}
                value={section.brandDescription}
                onChange={(brandDescription) => onUpdateSection({ ...section, brandDescription })}
              />
              <TextField
                label="Dòng bản quyền"
                value={section.copyright}
                onChange={(copyright) => onUpdateSection({ ...section, copyright })}
              />
            </div>

            {section.variant === 'columns' && (
              <div className="st-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="st-group-title" style={{ margin: 0 }}>
                    Các cột liên kết
                  </span>
                  <button
                    type="button"
                    className="st-btn st-btn-sm"
                    onClick={() =>
                      onUpdateSection({
                        ...section,
                        columns: [
                          ...section.columns,
                          {
                            id: generateId('fc'),
                            title: 'Cột mới',
                            links: [{ id: generateId('fl'), label: 'Liên kết', href: '#top' }],
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={12} /> Thêm cột
                  </button>
                </div>

                {section.columns.map((col, cIdx) => (
                  <div key={col.id} className="st-subcard">
                    <div className="st-subcard-head">
                      <span>{col.title}</span>
                      <button
                        type="button"
                        className="st-mini-btn"
                        onClick={() =>
                          onUpdateSection({
                            ...section,
                            columns: section.columns.filter((c) => c.id !== col.id),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <TextField
                      label="Tiêu đề cột"
                      value={col.title}
                      onChange={(title) => {
                        const next = [...section.columns];
                        next[cIdx] = { ...col, title };
                        onUpdateSection({ ...section, columns: next });
                      }}
                    />
                    {col.links.map((lnk, lIdx) => (
                      <div key={lnk.id} style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        <input
                          type="text"
                          className="st-input"
                          value={lnk.label}
                          placeholder="Nhãn"
                          onChange={(e) => {
                            const nextCols = [...section.columns];
                            const nextLinks = [...col.links];
                            nextLinks[lIdx] = { ...lnk, label: e.target.value };
                            nextCols[cIdx] = { ...col, links: nextLinks };
                            onUpdateSection({ ...section, columns: nextCols });
                          }}
                        />
                        <input
                          type="text"
                          className="st-input"
                          value={lnk.href}
                          placeholder="#anchor"
                          onChange={(e) => {
                            const nextCols = [...section.columns];
                            const nextLinks = [...col.links];
                            nextLinks[lIdx] = { ...lnk, href: e.target.value };
                            nextCols[cIdx] = { ...col, links: nextLinks };
                            onUpdateSection({ ...section, columns: nextCols });
                          }}
                        />
                        <button
                          type="button"
                          className="st-mini-btn"
                          onClick={() => {
                            const nextCols = [...section.columns];
                            nextCols[cIdx] = {
                              ...col,
                              links: col.links.filter((x) => x.id !== lnk.id),
                            };
                            onUpdateSection({ ...section, columns: nextCols });
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="st-btn st-btn-sm"
                      onClick={() => {
                        const nextCols = [...section.columns];
                        nextCols[cIdx] = {
                          ...col,
                          links: [...col.links, { id: generateId('fl'), label: 'Mục mới', href: '#' }],
                        };
                        onUpdateSection({ ...section, columns: nextCols });
                      }}
                    >
                      <Plus size={12} /> Thêm link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <aside className="st-inspector">
      <div className="st-inspector-head">
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{getSectionLabel(section.type)}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>ID neo: #{section.anchorId || section.id}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="st-btn st-btn-sm"
            title={section.visible ? 'Ẩn khối' : 'Hiện khối'}
            onClick={() =>
              onUpdateSection({ ...section, visible: !section.visible } as LandingSection)
            }
          >
            {section.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <button
            type="button"
            className="st-btn st-btn-sm st-btn-danger"
            title="Xóa khối"
            onClick={() => onDeleteSection(section.id)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="st-scroll-body">
        {!section.visible && (
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              fontSize: 12,
              marginBottom: 14,
              color: '#92400e',
            }}
          >
            Khối này đang được ẩn khỏi trang khách hàng. Bấm biểu tượng Con mắt ở trên để bật lại.
          </div>
        )}

        {renderSectionSpecific()}

        <div className="st-group">
          <div className="st-group-title">Giao diện riêng của khối này</div>
          <VariantSelector<SectionSurface>
            label="Màu nền khối"
            value={section.style.surface}
            options={[
              { value: 'default', label: 'Nền chính' },
              { value: 'alt', label: 'Xen kẽ' },
              { value: 'accent', label: 'Nhấn nhẹ' },
              { value: 'contrast', label: 'Tương phản' },
            ]}
            onChange={(surface) => updateStyle({ surface })}
          />
          <VariantSelector<SectionPadding>
            label="Khoảng đệm trên/dưới"
            value={section.style.padding}
            options={[
              { value: 'compact', label: 'Gọn' },
              { value: 'normal', label: 'Chuẩn' },
              { value: 'spacious', label: 'Rộng' },
            ]}
            onChange={(padding) => updateStyle({ padding })}
          />
          <VariantSelector<'center' | 'left'>
            label="Căn lề tiêu đề khối"
            value={section.style.align ?? 'center'}
            options={[
              { value: 'center', label: 'Căn giữa' },
              { value: 'left', label: 'Căn trái' },
            ]}
            onChange={(align) => updateStyle({ align })}
          />
          <VariantSelector<SectionMaxWidth>
            label="Độ rộng khối"
            value={section.style.maxWidth ?? 'standard'}
            options={[
              { value: 'narrow', label: 'Hẹp' },
              { value: 'standard', label: 'Chuẩn' },
              { value: 'wide', label: 'Rộng' },
            ]}
            onChange={(maxWidth) => updateStyle({ maxWidth })}
          />
          <div className="st-subcard">
            <div className="st-subcard-head">
              <span>Màu nền & Chữ riêng cho khối này</span>
              {(section.style.customBg || section.style.customText) && (
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() => updateStyle({ customBg: undefined, customText: undefined })}
                >
                  Đặt lại
                </button>
              )}
            </div>
            <div className="st-color-row">
              <div>
                <span className="st-label">Màu nền riêng</span>
                <div className="st-color-box">
                  <input
                    type="color"
                    value={section.style.customBg || '#FFFFFF'}
                    onChange={(e) => {
                      const bg = e.target.value;
                      updateStyle({
                        customBg: bg,
                        customText: section.style.customText || pickReadableText(bg),
                      });
                    }}
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {section.style.customBg || 'Theo theme'}
                  </span>
                </div>
              </div>
              <div>
                <span className="st-label">Màu chữ riêng</span>
                <div className="st-color-box">
                  <input
                    type="color"
                    value={section.style.customText || '#111827'}
                    onChange={(e) => updateStyle({ customText: e.target.value })}
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {section.style.customText || 'Tự động'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <TextField
            label="ID neo (Anchor link, VD: products)"
            value={section.anchorId}
            onChange={(anchorId) =>
              onUpdateSection({
                ...section,
                anchorId: anchorId.replace(/[^a-zA-Z0-9_-]/g, ''),
              } as LandingSection)
            }
          />
        </div>
      </div>
    </aside>
  );
}
