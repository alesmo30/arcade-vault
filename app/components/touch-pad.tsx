"use client";

import { useRef, useState } from "react";
import type { PadLayout } from "@/app/games/engines/controls";
import type { ControlAction } from "@/app/games/engines/types";

const DPAD_ARROWS: Record<string, string> = {
  left: "◀",
  right: "▶",
  up: "▲",
  down: "▼",
};

type Props = {
  layout: PadLayout;
  onControl: (action: ControlAction, pressed: boolean) => void;
};

export function TouchPad({ layout, onControl }: Props) {
  const [active, setActive] = useState<Set<ControlAction>>(new Set());
  const pointerActions = useRef<Map<number, ControlAction>>(new Map());

  const press = (action: ControlAction) => {
    setActive((prev) => new Set(prev).add(action));
    onControl(action, true);
  };

  const release = (action: ControlAction) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.delete(action);
      return next;
    });
    onControl(action, false);
  };

  const bind = (action: ControlAction) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      pointerActions.current.set(e.pointerId, action);
      press(action);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      pointerActions.current.delete(e.pointerId);
      release(action);
    },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
      pointerActions.current.delete(e.pointerId);
      release(action);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerActions.current.get(e.pointerId) !== action) return;
      pointerActions.current.delete(e.pointerId);
      release(action);
    },
  });

  return (
    <div className="touch-pad" role="group" aria-label="Controles táctiles">
      <div className="touch-dpad" data-dirs={layout.dpad.length}>
        {layout.dpad.map((action) => (
          <button
            key={action}
            type="button"
            className={`touch-btn touch-dir touch-dir-${action}${active.has(action) ? " active" : ""}`}
            aria-label={action}
            {...bind(action)}
          >
            {DPAD_ARROWS[action]}
          </button>
        ))}
      </div>
      {layout.buttons.length > 0 && (
        <div className="touch-actions">
          {layout.buttons.map((btn) => (
            <button
              key={btn.action}
              type="button"
              className={`touch-btn touch-action${active.has(btn.action) ? " active" : ""}`}
              aria-label={btn.label}
              {...bind(btn.action)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
