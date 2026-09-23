import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Cards a few levels up the tree (.card-list > *, .panel-body > *, …) carry
// a permanent entrance `animation`, which per spec makes them establish
// their own stacking context regardless of play state — trapping any
// z-index set on a descendant tooltip below unrelated siblings elsewhere on
// the page (e.g. the sticky search/toolbar bars) no matter how high that
// z-index is. Portaling the tooltip straight to <body>, positioned from the
// trigger's live bounding rect, sidesteps that entirely instead of fighting
// it with more z-index. Inline styles (not the scoped .scope-vN classes)
// are used here since the portalled node renders outside that scope.
const TOOLTIP_STYLE: CSSProperties = {
  position: 'fixed',
  background: '#1a1a1a',
  color: '#fff',
  font: '400 12px/1.4 var(--font-family)',
  letterSpacing: '0.3px',
  padding: '10px 12px',
  borderRadius: 4,
  boxShadow: '0 3px 4px 0 rgba(0, 0, 0, 0.14), 0 1px 8px 0 rgba(0, 0, 0, 0.2)',
  zIndex: 1000,
  pointerEvents: 'none',
  width: 'max-content',
  maxWidth: 220,
};

type HoverTooltipProps = {
  children: ReactNode;
  text: string;
  className?: string;
  align?: 'left' | 'right';
  // 'top' (default) opens the tooltip above the trigger — but a trigger
  // near the top of the viewport (e.g. the drawer header) would have that
  // tooltip clipped off-screen, so 'bottom' opens it below instead.
  side?: 'top' | 'bottom';
};

export default function HoverTooltip({ children, text, className, align = 'right', side = 'top' }: HoverTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  return (
    <span
      ref={ref}
      className={className}
      onMouseEnter={() => setRect(ref.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setRect(null)}
    >
      {children}
      {rect &&
        createPortal(
          <span
            style={{
              ...TOOLTIP_STYLE,
              top: side === 'bottom' ? rect.bottom + 8 : rect.top - 8,
              left: align === 'right' ? rect.right : rect.left,
              transform:
                side === 'bottom'
                  ? align === 'right'
                    ? 'translateX(-100%)'
                    : undefined
                  : align === 'right'
                    ? 'translate(-100%, -100%)'
                    : 'translateY(-100%)',
            }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
