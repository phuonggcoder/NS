import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  Crosshair,
  Eye,
  EyeOff,
  Hand,
  Maximize2,
  Monitor,
  MousePointer,
  Smartphone,
  Tablet,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { ViewportMode } from '../types/spec';

export interface CanvasStageHandle {
  focusTarget: (sectionId: string, fieldKey?: string | null) => void;
  fitToScreen: () => void;
}

interface CanvasStageProps {
  viewport: ViewportMode;
  cleanPreview: boolean;
  canJumpToFocus: boolean;
  activeFocusLabel: string | null;
  onViewportChange: (mode: ViewportMode) => void;
  onToggleCleanPreview: () => void;
  onJumpToFocus: () => void;
  onBackgroundClick: () => void;
  children: ReactNode;
}

const ARTBOARD_WIDTHS: Record<ViewportMode, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

export const CanvasStage = forwardRef<CanvasStageHandle, CanvasStageProps>(
  function CanvasStage(
    {
      viewport,
      cleanPreview,
      canJumpToFocus,
      activeFocusLabel,
      onViewportChange,
      onToggleCleanPreview,
      onJumpToFocus,
      onBackgroundClick,
      children,
    },
    ref
  ) {
    const stageRef = useRef<HTMLDivElement>(null);
    const artboardRef = useRef<HTMLDivElement>(null);

    const [tool, setTool] = useState<'select' | 'pan'>('select');
    const [spaceHeld, setSpaceHeld] = useState(false);
    const [zoom, setZoom] = useState<number>(0.72);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [animating, setAnimating] = useState(false);

    const dragOriginRef = useRef<{
      startX: number;
      startY: number;
      origPanX: number;
      origPanY: number;
    } | null>(null);
    const animTimerRef = useRef<number | null>(null);

    const artboardWidth = ARTBOARD_WIDTHS[viewport];

    const computeFitZoom = useCallback(
      (mode: ViewportMode = viewport) => {
        const el = stageRef.current;
        if (!el) return 0.72;
        const w = el.clientWidth;
        const targetW = ARTBOARD_WIDTHS[mode];
        return Number(Math.min(1, Math.max(0.32, (w - 64) / targetW)).toFixed(2));
      },
      [viewport]
    );

    const fitToScreen = useCallback(() => {
      const nextZoom = computeFitZoom(viewport);
      setAnimating(true);
      setZoom(nextZoom);
      setPan({ x: 0, y: 20 });
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
      animTimerRef.current = window.setTimeout(() => setAnimating(false), 260);
    }, [computeFitZoom, viewport]);

    // Auto-fit when viewport mode switches or on first mount
    useEffect(() => {
      fitToScreen();
    }, [viewport, fitToScreen]);

    // Track Space key for instant Figma-style temporary Pan tool
    useEffect(() => {
      const isInputFocused = (t: EventTarget | null) => {
        const el = t as HTMLElement | null;
        return Boolean(
          el &&
            (el.tagName === 'INPUT' ||
              el.tagName === 'TEXTAREA' ||
              el.tagName === 'SELECT' ||
              el.isContentEditable)
        );
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !isInputFocused(e.target)) {
          e.preventDefault();
          setSpaceHeld(true);
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') setSpaceHeld(false);
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }, []);

    // Non-passive wheel listener for smooth zoom (Ctrl+Wheel) and free scroll panning
    useEffect(() => {
      const el = stageRef.current;
      if (!el) return;

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          setZoom((prev) => {
            const next = prev - e.deltaY * 0.0014;
            return Number(Math.min(1.5, Math.max(0.3, next)).toFixed(2));
          });
          return;
        }
        setPan((prev) => {
          const artH = (artboardRef.current?.offsetHeight || 2400) * zoom;
          const minY = -(artH - 140);
          const maxY = 120;
          return {
            x: Math.max(-900, Math.min(900, prev.x - e.deltaX)),
            y: Math.max(minY, Math.min(maxY, prev.y - e.deltaY)),
          };
        });
      };

      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }, [zoom]);

    useImperativeHandle(
      ref,
      () => ({
        fitToScreen,
        focusTarget: (sectionId: string, fieldKey?: string | null) => {
          window.requestAnimationFrame(() => {
            const stageEl = stageRef.current;
            if (!stageEl) return;

            const selector = fieldKey
              ? `[data-lp-field="${sectionId}:${fieldKey}"]`
              : `[data-lp-section-id="${sectionId}"]`;
            const targetEl =
              (document.querySelector(selector) as HTMLElement | null) ||
              (document.querySelector(`[data-lp-section-id="${sectionId}"]`) as HTMLElement | null);

            if (!targetEl) return;
            const stageRect = stageEl.getBoundingClientRect();
            const elRect = targetEl.getBoundingClientRect();

            const targetCenterX = elRect.left + elRect.width / 2;
            const targetAnchorY = elRect.top + Math.min(elRect.height / 2, 160);
            const stageCenterX = stageRect.left + stageRect.width / 2;
            const stageAnchorY = stageRect.top + stageRect.height * 0.34;

            const deltaX = stageCenterX - targetCenterX;
            const deltaY = stageAnchorY - targetAnchorY;

            setAnimating(true);
            setPan((prev) => ({
              x: Math.max(-900, Math.min(900, prev.x + deltaX)),
              y: Math.min(120, prev.y + deltaY),
            }));
            if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
            animTimerRef.current = window.setTimeout(() => setAnimating(false), 260);
          });
        },
      }),
      [fitToScreen]
    );

    const effectivePanMode = tool === 'pan' || spaceHeld;

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
      const isMiddle = e.button === 1;
      const clickedBackground = e.target === stageRef.current;
      if (!effectivePanMode && !isMiddle && !clickedBackground) {
        return;
      }

      if (isMiddle) e.preventDefault();
      setIsDragging(true);
      dragOriginRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragOriginRef.current) return;
      const dx = e.clientX - dragOriginRef.current.startX;
      const dy = e.clientY - dragOriginRef.current.startY;
      setPan({
        x: Math.max(-900, Math.min(900, dragOriginRef.current.origPanX + dx)),
        y: Math.min(160, dragOriginRef.current.origPanY + dy),
      });
    };

    const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const origin = dragOriginRef.current;
      const moved =
        origin &&
        (Math.abs(e.clientX - origin.startX) > 4 || Math.abs(e.clientY - origin.startY) > 4);
      setIsDragging(false);
      dragOriginRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (!moved && e.target === stageRef.current) {
        onBackgroundClick();
      }
    };

    return (
      <main
        ref={stageRef}
        className={`st-canvas-stage ${effectivePanMode ? 'is-pan-cursor' : ''} ${
          isDragging ? 'is-dragging' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="st-artboard-slot"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transition: animating ? 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
          onClick={(e) => {
            if (effectivePanMode) e.stopPropagation();
          }}
        >
          <div
            ref={artboardRef}
            className="st-canvas-frame"
            style={{
              width: artboardWidth,
              pointerEvents: effectivePanMode ? 'none' : 'auto',
            }}
          >
            {children}
          </div>
        </div>

        {/* Floating Minimalist Bottom Canvas Dock */}
        <div className="st-canvas-dock" onPointerDown={(e) => e.stopPropagation()}>
          <div className="st-dock-group">
            <button
              type="button"
              className={`st-dock-btn ${tool === 'select' && !spaceHeld ? 'is-active' : ''}`}
              onClick={() => setTool('select')}
              title="Công cụ Chọn & Chỉnh sửa (V)"
            >
              <MousePointer size={14} />
            </button>
            <button
              type="button"
              className={`st-dock-btn ${effectivePanMode ? 'is-active' : ''}`}
              onClick={() => setTool((prev) => (prev === 'pan' ? 'select' : 'pan'))}
              title="Công cụ Kéo di chuyển (Giữ Space + Kéo)"
            >
              <Hand size={14} />
            </button>
          </div>

          <div className="st-dock-divider" />

          <div className="st-dock-group">
            <button
              type="button"
              className={`st-dock-btn ${viewport === 'desktop' ? 'is-active' : ''}`}
              onClick={() => onViewportChange('desktop')}
              title="Khung Desktop (1280px)"
            >
              <Monitor size={14} />
            </button>
            <button
              type="button"
              className={`st-dock-btn ${viewport === 'tablet' ? 'is-active' : ''}`}
              onClick={() => onViewportChange('tablet')}
              title="Khung Tablet (768px)"
            >
              <Tablet size={14} />
            </button>
            <button
              type="button"
              className={`st-dock-btn ${viewport === 'mobile' ? 'is-active' : ''}`}
              onClick={() => onViewportChange('mobile')}
              title="Khung Mobile (390px)"
            >
              <Smartphone size={14} />
            </button>
          </div>

          <div className="st-dock-divider" />

          <div className="st-dock-group">
            <button
              type="button"
              className="st-dock-btn"
              onClick={() => setZoom((z) => Number(Math.max(0.3, z - 0.1).toFixed(2)))}
              title="Thu nhỏ"
            >
              <ZoomOut size={14} />
            </button>
            <span className="st-zoom-label">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="st-dock-btn"
              onClick={() => setZoom((z) => Number(Math.min(1.5, z + 0.1).toFixed(2)))}
              title="Phóng to (Ctrl + Cuộn chuột)"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              className="st-dock-btn"
              onClick={fitToScreen}
              title="Vừa khung nhìn"
            >
              <Maximize2 size={13} />
              <span style={{ fontSize: 11 }}>Vừa</span>
            </button>
            <button
              type="button"
              className="st-dock-btn"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 20 });
              }}
              title="Kích thước thật 100%"
            >
              <span style={{ fontSize: 11 }}>100%</span>
            </button>
          </div>

          {canJumpToFocus && (
            <>
              <div className="st-dock-divider" />
              <button
                type="button"
                className="st-dock-btn is-accent"
                onClick={onJumpToFocus}
                title={
                  activeFocusLabel
                    ? `Quay lại xem thử: ${activeFocusLabel}`
                    : 'Quay lại mục đang sửa'
                }
              >
                <Crosshair size={13} />
                <span style={{ fontSize: 11.5 }}>Về mục đang sửa</span>
              </button>
            </>
          )}

          <div className="st-dock-divider" />
          <button
            type="button"
            className={`st-dock-btn ${cleanPreview ? 'is-active' : ''}`}
            onClick={onToggleCleanPreview}
            title="Ẩn khung chọn để xem sạch như trang khách hàng"
          >
            {cleanPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span style={{ fontSize: 11.5 }}>{cleanPreview ? 'Hiện khung' : 'Xem sạch'}</span>
          </button>
        </div>
      </main>
    );
  }
);
