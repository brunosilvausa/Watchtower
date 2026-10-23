import React from 'react';
import { useSpatialTilt, spatialLayers, tiltTransform } from './spatial.js';
export function Tilt({ max = 'medium', lift = 20, reflection = 1, spring = 'spatial', radius = 'var(--radius-lg)', disabled, children, style }) {
  const ref = React.useRef(null);
  useSpatialTilt(ref, { enabled: !disabled, max, lift, spring });
  return (
    <div ref={ref} style={{ position: 'relative', borderRadius: radius, transform: tiltTransform, ...style }}>
      {spatialLayers(reflection)}
      {children}
    </div>
  );
}
