import { cloneElement, useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';

export function GameTooltip({
  label,
  children,
  placement = 'bottom',
}: {
  label?: ReactNode;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  placement?: Placement;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const { refs, floatingStyles } = useFloating({
    open,
    placement,
    middleware: [offset(8), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });
  if (!label) return children;
  const describedBy =
    [children.props['aria-describedby'], open ? id : undefined].filter(Boolean).join(' ') ||
    undefined;
  return (
    <>
      <span
        className="gameHint"
        ref={refs.setReference}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        {cloneElement(children, { 'aria-describedby': describedBy })}
      </span>
      {open && (
        <FloatingPortal>
          <div
            className="poiTooltip poiTheme"
            id={id}
            role="tooltip"
            ref={refs.setFloating}
            style={floatingStyles}
          >
            {label}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
