import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Skeleton } from '../feedback/Skeleton.jsx';
import { Sparkline } from './Sparkline.jsx';
import { material, useSpatialTilt, spatialLayers, tiltTransform, typo } from '../core/spatial.js';
export function StatCard({ label, icon, value, unit, delta, deltaDirection = 'up', deltaTone, caption, highlight, featured, emphasis = 'primary', trend, trendLabel,
  loading, unavailable, onClick, style }) {
  const ref = React.useRef(null);
  const quiet = emphasis === 'secondary' && !featured;
  const live = useSpatialTilt(ref, { enabled: !!featured || !!onClick, max: featured ? 'subtle' : 0, lift: featured ? 16 : 8 });
  const tone = deltaTone || (deltaDirection === 'up' ? 'up' : deltaDirection === 'down' ? 'down' : 'neutral');
  const tc = tone === 'up' ? 'var(--status-up)' : tone === 'down' ? 'var(--status-down)' : 'var(--text-tertiary)';
  const missing = unavailable || value == null || value === '';
  const sign = deltaDirection === 'down' ? '−' : deltaDirection === 'flat' ? '' : '+';
  const dirWord = deltaDirection === 'down' ? 'Down' : deltaDirection === 'flat' ? 'No change' : 'Up';
  const surface = quiet
    ? { background: 'var(--surface-nested)', border: '1px solid var(--border-subtle)' }
    : material('frosted', featured ? 2 : 1);
  const Tag = onClick ? 'button' : 'section';
  return (
    <Tag ref={ref} type={onClick ? 'button' : undefined} onClick={onClick} aria-busy={loading || undefined}
      style={{ position: 'relative', textAlign: 'left', width: '100%', borderRadius: 'var(--radius-lg)', padding: quiet ? 'var(--space-md) var(--space-lg)' : 'var(--space-card)', display: 'flex', flexDirection: 'column', justifyContent: featured ? 'space-between' : undefined, gap: quiet ? 10 : 14, minWidth: 0,
        fontFamily: 'var(--font-sans)', color: 'inherit', cursor: onClick ? 'pointer' : 'default', ...surface,
        ...(featured || onClick ? { transform: tiltTransform, zIndex: 'calc(1 + var(--wt-hover, 0) * 2)' } : null), ...style }}>
      {live && spatialLayers(featured ? 1 : 0.6)}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, color: quiet ? 'var(--text-secondary)' : 'var(--text-strong)' }}>
        {icon && !quiet && <span aria-hidden="true" style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', border: '1px solid var(--border-default)', background: 'var(--surface-nested-strong)', boxShadow: 'var(--elev-1-edge)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={15} /></span>}
        {icon && quiet && <Icon name={icon} size={15} color="var(--text-tertiary)" />}
        <span style={{ ...typo('overline'), letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
      </div>
      {loading ? <>
        <span className="wt-sr-only">Loading {label}</span>
        <Skeleton variant="block" width="56%" height={quiet ? 24 : 34} radius="var(--radius-sm)" />
        <Skeleton lines={1} width="70%" />
      </> : <>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
            {missing
              ? <span style={{ ...typo(quiet ? 'value-md' : featured ? 'value-xl' : 'value-lg'), ...(quiet ? { fontSize: 24 } : null), color: 'var(--text-tertiary)' }} aria-label={label + ': no data'}>—</span>
              : <span style={{ ...typo(quiet ? 'value-md' : featured ? 'value-xl' : 'value-lg'), ...(quiet ? { fontSize: 24, letterSpacing: '-0.5px' } : null), fontWeight: 700,
                  color: highlight ? 'var(--primary)' : 'var(--text-primary)', textShadow: highlight ? 'var(--glow-text-neon)' : 'none', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: 'var(--numeric-features)', whiteSpace: 'nowrap' }}>{value}</span>}
            {unit && !missing && <span style={{ fontSize: quiet ? 14 : 16, fontWeight: 600, color: 'var(--text-tertiary)' }}>{unit}</span>}
          </div>
          {trend && !missing && <Sparkline data={trend} width={quiet ? 64 : 88} height={quiet ? 22 : 30} color={highlight ? 'var(--chart-series-primary)' : 'var(--chart-series-2)'} ariaLabel={trendLabel || label + ' trend'} />}
        </div>
        {missing
          ? <div style={{ position: 'relative', ...typo('caption'), color: 'var(--text-tertiary)' }}>{typeof unavailable === 'string' ? unavailable : 'No data for this period'}</div>
          : (delta || caption) && <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', ...typo('caption'), color: 'var(--text-tertiary)' }}>
            {delta && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: tc, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              <Icon name={deltaDirection === 'down' ? 'trending-down' : deltaDirection === 'flat' ? 'minus' : 'trending-up'} size={14} />
              <span className="wt-sr-only">{dirWord} </span><span aria-hidden="true">{/^[+−-]/.test(delta) ? '' : sign}</span>{delta}</span>}
            {caption && <span>{caption}</span>}
          </div>}
      </>}
    </Tag>
  );
}
