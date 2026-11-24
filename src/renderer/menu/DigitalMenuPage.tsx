import { useMemo, useState, type CSSProperties } from 'react';
import { LayoutGrid, List, MapPin, Search, UtensilsCrossed } from 'lucide-react';
import { formatMenuPrice, getEffectiveBasePrice } from '../../data/digitalMenuDefaults';
import type { DigitalMenuConfig, MenuItem } from '../../types/spec';
import { sanitizeImageSrc } from '../../utils/storage';
import { MenuItemModal } from './MenuItemModal';
import './digital-menu.css';

interface DigitalMenuPageProps {
  menu: DigitalMenuConfig;
  clientSlug?: string;
  branch?: string;
  table?: string;
  previewOnly?: boolean;
  onItemOpened?: (item: MenuItem) => void;
}

export function DigitalMenuPage({
  menu,
  clientSlug,
  branch,
  table,
  previewOnly = false,
  onItemOpened,
}: DigitalMenuPageProps) {
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [layoutOverride, setLayoutOverride] = useState<'grid' | 'list' | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const layout = layoutOverride ?? menu.theme.layout ?? 'grid';
  const isDark = menu.theme.mode === 'dark';

  const cssVars = {
    '--dm-primary': menu.theme.primaryColor || '#8B4513',
    '--dm-accent': menu.theme.accentColor || '#D97706',
    '--dm-bg': isDark ? '#0F172A' : menu.theme.backgroundColor || '#FFFFFF',
    '--dm-text': isDark ? '#F8FAFC' : menu.theme.textColor || '#0F172A',
    '--dm-font': menu.theme.fontFamily || "'Be Vietnam Pro', sans-serif",
  } as CSSProperties;

  const visibleCategories = useMemo(
    () =>
      [...(menu.categories || [])]
        .filter((c) => c.visible)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [menu.categories]
  );

  const filteredByCategory = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sortedItems = [...(menu.items || [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    return visibleCategories
      .filter((cat) => activeCategoryId === 'all' || cat.id === activeCategoryId)
      .map((cat) => {
        const items = sortedItems.filter((item) => {
          if (item.categoryId !== cat.id) return false;
          if (!q) return true;
          return (
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            (item.ingredients || '').toLowerCase().includes(q)
          );
        });
        return { category: cat, items };
      })
      .filter((group) => group.items.length > 0);
  }, [visibleCategories, menu.items, search, activeCategoryId]);

  const safeBanner = sanitizeImageSrc(menu.theme.bannerUrl);

  const handleOpenItem = (item: MenuItem) => {
    setSelectedItem(item);
    onItemOpened?.(item);
  };

  return (
    <div className={`dm-root ${isDark ? 'is-dark' : ''}`} style={cssVars}>
      <header className="dm-banner">
        {safeBanner && <img src={safeBanner} alt={menu.brandName} />}
        <div className="dm-banner-scrim" />
        <div className="dm-banner-content">
          <h1 className="dm-banner-title">{menu.theme.bannerTitle || menu.brandName}</h1>
          <p className="dm-banner-sub">
            {menu.theme.bannerSubtitle || menu.description || 'Thực đơn điện tử'}
          </p>
          {(branch || table) && (
            <div className="dm-table-badge">
              <MapPin size={13} />
              <span>
                {[branch ? `Chi nhánh: ${branch}` : '', table ? `Bàn: ${table}` : '']
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="dm-container">
        <div className="dm-toolbar">
          <div className="dm-search-row">
            <div className="dm-search-wrap">
              <Search size={15} className="dm-search-icon" />
              <input
                type="search"
                className="dm-search-input"
                placeholder="Tìm món ăn, đồ uống, thành phần..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="dm-icon-btn"
              title={layout === 'grid' ? 'Chuyển sang dạng Danh sách' : 'Chuyển sang dạng Lưới'}
              onClick={() => setLayoutOverride(layout === 'grid' ? 'list' : 'grid')}
            >
              {layout === 'grid' ? <List size={17} /> : <LayoutGrid size={17} />}
            </button>
          </div>

          {menu.theme.showCategoryNav !== false && visibleCategories.length > 0 && (
            <nav className="dm-cat-nav" aria-label="Danh mục thực đơn">
              <button
                type="button"
                className={`dm-cat-pill ${activeCategoryId === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveCategoryId('all')}
              >
                Tất cả
              </button>
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`dm-cat-pill ${activeCategoryId === cat.id ? 'is-active' : ''}`}
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          )}
        </div>

        {filteredByCategory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--dm-muted)' }}>
            <UtensilsCrossed size={32} style={{ opacity: 0.45, marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: 15 }}>Không tìm thấy món phù hợp</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
            </div>
          </div>
        ) : (
          filteredByCategory.map(({ category, items }) => {
            const catThumb = sanitizeImageSrc(category.imageUrl);
            return (
              <section key={category.id} className="dm-cat-section">
                <div className="dm-cat-header">
                  {catThumb && <img src={catThumb} alt={category.name} className="dm-cat-thumb" />}
                  <div>
                    <h2 className="dm-cat-title">{category.name}</h2>
                    {category.description && (
                      <p className="dm-cat-desc">{category.description}</p>
                    )}
                  </div>
                </div>

                <div className={layout === 'list' ? 'dm-items-list' : 'dm-items-grid'}>
                  {items.map((item) => {
                    const isSoldOut = item.status === 'sold_out';
                    const safeImg = sanitizeImageSrc(item.imageUrl);
                    const nowPrice = getEffectiveBasePrice(item);
                    const hasSale =
                      typeof item.salePrice === 'number' &&
                      item.salePrice > 0 &&
                      item.salePrice < item.price;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`dm-card ${layout === 'list' ? 'is-list' : ''} ${
                          isSoldOut ? 'is-soldout' : ''
                        }`}
                        onClick={() => handleOpenItem(item)}
                      >
                        <div className="dm-card-media">
                          {safeImg ? (
                            <img src={safeImg} alt={item.name} loading="lazy" />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--dm-muted)',
                              }}
                            >
                              <UtensilsCrossed size={24} />
                            </div>
                          )}
                          <div className="dm-badges">
                            {isSoldOut && <span className="dm-badge dm-badge-soldout">Tạm hết</span>}
                            {!isSoldOut && item.bestSeller && (
                              <span className="dm-badge dm-badge-best">Best Seller</span>
                            )}
                            {!isSoldOut && item.featured && (
                              <span className="dm-badge dm-badge-featured">Nổi bật</span>
                            )}
                          </div>
                        </div>

                        <div className="dm-card-body">
                          <div className="dm-card-name">{item.name}</div>
                          {item.description && (
                            <div className="dm-card-desc">{item.description}</div>
                          )}
                          <div className="dm-card-foot">
                            <div>
                              <span className="dm-price-now">
                                {formatMenuPrice(nowPrice, menu.currency)}
                              </span>
                              {hasSale && (
                                <span className="dm-price-old">
                                  {formatMenuPrice(item.price, menu.currency)}
                                </span>
                              )}
                            </div>
                            <span className="dm-add-pill">
                              {isSoldOut ? 'Hết' : item.optionGroups?.length ? 'Tùy chọn' : '+ Chọn'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      <MenuItemModal
        item={selectedItem}
        currency={menu.currency}
        clientSlug={clientSlug}
        branch={branch}
        table={table}
        previewOnly={previewOnly}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
