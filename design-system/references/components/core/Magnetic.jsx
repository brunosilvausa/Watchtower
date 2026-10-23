import React from 'react';
import { useMagnetic, magneticStyle } from './spatial.js';
export function Magnetic({ strength = 4, disabled, children, style }) {
  const ref = React.useRef(null);
  useMagnetic(ref, { enabled: !disabled, strength });
  return <span ref={ref} style={{ display: 'inline-flex', ...magneticStyle, ...style }}>{children}</span>;
}
