import { createContext, useContext, type MouseEvent, type ReactNode } from 'react';

export interface StudioFocusContextValue {
  isStudio: boolean;
  cleanPreview: boolean;
  selectedSectionId: string | null;
  activeFieldKey: string | null;
  activeFieldLabel: string | null;
  onFocusField: (sectionId: string, fieldKey: string, fieldLabel: string) => void;
}

const DEFAULT_FOCUS_CONTEXT: StudioFocusContextValue = {
  isStudio: false,
  cleanPreview: false,
  selectedSectionId: null,
  activeFieldKey: null,
  activeFieldLabel: null,
  onFocusField: () => {},
};

const StudioFocusContext = createContext<StudioFocusContextValue>(DEFAULT_FOCUS_CONTEXT);

export function StudioFocusProvider({
  value,
  children,
}: {
  value: StudioFocusContextValue;
  children: ReactNode;
}) {
  return <StudioFocusContext.Provider value={value}>{children}</StudioFocusContext.Provider>;
}

export function useStudioFocus(): StudioFocusContextValue {
  return useContext(StudioFocusContext);
}

export interface StudioFieldProps {
  className?: string;
  'data-lp-field'?: string;
  'data-lp-field-label'?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
}

export function useStudioFieldProps(
  sectionId: string,
  fieldKey: string,
  fieldLabel: string,
  existingClassName?: string
): StudioFieldProps {
  const ctx = useContext(StudioFocusContext);

  if (!ctx.isStudio || ctx.cleanPreview) {
    return existingClassName ? { className: existingClassName } : {};
  }

  const isSameSection = ctx.selectedSectionId === sectionId;
  const isActive =
    isSameSection &&
    (ctx.activeFieldKey === fieldKey ||
      (ctx.activeFieldKey === 'items' && fieldKey === 'item-0') ||
      (ctx.activeFieldKey === 'tiers' && fieldKey === 'tier-0'));

  const className = [
    existingClassName,
    'lp-editable-el',
    isActive ? 'lp-canva-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    className,
    'data-lp-field': `${sectionId}:${fieldKey}`,
    'data-lp-field-label': fieldLabel,
    onClick: (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      ctx.onFocusField(sectionId, fieldKey, fieldLabel);
    },
  };
}
