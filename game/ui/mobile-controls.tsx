'use client';
import { useEffect, useRef, useState } from 'react';
import type { MobileInput } from '../simulation/mobile-input';

export function MobileControls({
  active,
  onInput,
}: {
  active: boolean;
  onInput: (input: MobileInput | null) => void;
}) {
  const [touch, setTouch] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const input = useRef<MobileInput>({ steer: 0, brake: false, drift: false, boost: false });
  const pointer = useRef<number | null>(null);
  const callback = useRef(onInput);
  callback.current = onInput;
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const update = () => setTouch(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!active || !touch) return;
    input.current = { steer: 0, brake: false, drift: false, boost: false };
    callback.current(input.current);
    const clear = () => {
      pointer.current = null;
      setStick({ x: 0, y: 0 });
      callback.current(null);
    };
    window.addEventListener('blur', clear);
    return () => {
      clear();
      window.removeEventListener('blur', clear);
    };
  }, [active, touch]);
  if (!touch || !active) return null;
  const change = (values: Partial<MobileInput>) => {
    input.current = { ...input.current, ...values };
    callback.current(input.current);
  };
  const release = () => {
    pointer.current = null;
    setStick({ x: 0, y: 0 });
    change({ steer: 0 });
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2 - 24;
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const scale = Math.min(1, radius / (Math.hypot(dx, dy) || 1));
    const x = dx * scale,
      y = dy * scale;
    setStick({ x, y });
    const normalized = x / radius;
    change({
      steer:
        Math.abs(normalized) < 0.12
          ? 0
          : (Math.sign(normalized) * (Math.abs(normalized) - 0.12)) / 0.88,
    });
  };
  return (
    <div className="mobile-controls">
      <div className="mobile-steering">
        <div
          className="mobile-stick"
          role="slider"
          tabIndex={0}
          aria-label="Steer left or right"
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-valuenow={Math.round(input.current.steer * 100)}
          onPointerDown={(event) => {
            if (pointer.current !== null) return;
            event.preventDefault();
            pointer.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            move(event);
          }}
          onPointerMove={(event) => {
            if (pointer.current === event.pointerId) move(event);
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              change({ steer: event.key === 'ArrowLeft' ? -1 : 1 });
            }
          }}
          onKeyUp={release}
          onBlur={release}
        >
          <span className="mobile-stick-arrows" aria-hidden="true">
            ← · →
          </span>
          <span
            className="mobile-stick-knob"
            style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }}
          />
        </div>
        <small>AUTO-ACCELERATE · STEER</small>
      </div>
      <div className="mobile-pedals">
        {(
          [
            ['brake', 'BRAKE / REV'],
            ['drift', 'DRIFT'],
            ['boost', 'BOOST'],
          ] as const
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={`mobile-${key}`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              change({ [key]: true });
            }}
            onPointerUp={() => change({ [key]: false })}
            onPointerCancel={() => change({ [key]: false })}
            onLostPointerCapture={() => change({ [key]: false })}
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                change({ [key]: true });
              }
            }}
            onKeyUp={() => change({ [key]: false })}
            onBlur={() => change({ [key]: false })}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
