"use client";
import { useId, useState, type CSSProperties } from "react";
import { finite, chartDomain, lineRuns, smoothPath, type Sample, clampPercent, nonnegativeSample } from "./chart-math";
import { Skeleton, StateMessage } from "./core";

export interface LineSeries { name: string; data: Sample[]; dashed?: boolean; primary?: boolean; area?: boolean }
export interface ChartProps { series: LineSeries[]; labels: string[]; label: string; loading?: boolean; error?: string; format?: (value: number) => string; compact?: boolean }
const numeric = (value: number) => String(value);
export function LineChart(props: ChartProps) { return <CartesianChart {...props} />; }
export function BarChart({ data, comparison, labels, label, loading, error }: { data: Sample[]; comparison?: Sample[]; labels: string[]; label: string; loading?: boolean; error?: string }) {
  return <CartesianChart series={[{ name: "Current", data }, ...(comparison ? [{ name: "Comparison", data: comparison, dashed: true }] : [])]} labels={labels} label={label} loading={loading} error={error} bars />;
}
function CartesianChart({ series, labels, label, loading, error, format = numeric, bars = false, compact = false }: ChartProps & { bars?: boolean }) {
  const id = useId(); const [index, setIndex] = useState<number | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = series.filter(item => !hidden.includes(item.name));
  const [low, high] = chartDomain(visible.map(item => item.data));
  const count = Math.max(0, ...series.map(item => item.data.length));
  const selected = index === null || !count ? null : Math.min(index, count - 1);
  const x = (i: number) => 40 + (count <= 1 ? 270 : i / (count - 1) * 540);
  const y = (v: number) => 180 - (v - low) / (high - low) * 150;
  if (loading) return <Skeleton label={`Loading ${label}`} style={{ height: "var(--chart-height)" }} />;
  if (error) return <StateMessage title="Chart unavailable" error>{error}</StateMessage>;
  if (!series.some(item => item.data.some(finite))) return <StateMessage title="No data yet">{label}</StateMessage>;
  return <figure className="ds-chart" data-compact={compact || undefined}><figcaption className={compact ? "wt-sr-only" : undefined} id={id}>{label}</figcaption>
    <div className="ds-chart-plot" tabIndex={0} role="group" aria-labelledby={id} aria-describedby={`${id}-help`} onMouseLeave={() => setIndex(null)} onKeyDown={event => {
      if (!count) return;
      if (["ArrowRight", "ArrowLeft", "Home", "End", "Escape"].includes(event.key)) {
        event.preventDefault();
        setIndex(event.key === "Escape" ? null : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : selected === null ? (event.key === "ArrowRight" ? 0 : count - 1) : Math.max(0, Math.min(count - 1, selected + (event.key === "ArrowRight" ? 1 : -1))));
      }
    }}>
      <svg viewBox="0 0 620 210" aria-hidden="true" onPointerMove={event => { const rect = event.currentTarget.getBoundingClientRect(); if (rect.width) setIndex(Math.max(0, Math.min(count - 1, Math.round(((event.clientX - rect.left) / rect.width * 620 - 40) / 540 * (count - 1))))); }}>
        <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".16" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3].map(tick => { const v = low + (high - low) * tick / 3; return <g key={tick}><line x1="40" x2="590" y1={y(v)} y2={y(v)} className="ds-chart-grid" /><text x="4" y={y(v)} className="ds-axis">{format(v)}</text></g>; })}
        {visible.map((item, s) => <g key={item.name} className={item.primary ? "ds-series-primary" : "ds-series"} style={{ opacity: s ? .6 : 1 }}>
          {bars ? item.data.map((v, i) => finite(v) && <rect key={i} x={x(i) - 5 + s * 8} y={Math.min(y(v), y(0))} width={Math.max(2, Math.min(14, 300 / count))} height={Math.max(1, Math.abs(y(v) - y(0)))} />) : lineRuns(item.data).map((run, r) => <g key={r}>{item.area && run.length > 1 && <path d={`${smoothPath(run.map(([i, v]) => [x(i), y(v)]))} L${x(run[run.length - 1][0])},${y(0)} L${x(run[0][0])},${y(0)} Z`} fill={`url(#${id}-area)`} />}<path d={smoothPath(run.map(([i, v]) => [x(i), y(v)]))} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={item.dashed ? "5 5" : undefined} />{run.length === 1 && <circle cx={x(run[0][0])} cy={y(run[0][1])} r="3" />}</g>)}
        </g>)}
        {selected !== null && <line x1={x(selected)} x2={x(selected)} y1="20" y2="180" className="ds-chart-crosshair" />}
      </svg>
    </div>
    <p id={`${id}-help`} className={compact ? "wt-sr-only" : "wt-caption"}>Use arrow keys to inspect samples. Missing values remain gaps.</p>
    <div className="ds-chart-readout" aria-live="polite">{selected !== null ? <>{labels[selected] ?? `Sample ${selected + 1}`}: {visible.map(item => `${item.name} ${finite(item.data[selected]) ? format(item.data[selected]) : "Missing"}`).join(" · ")}</> : compact ? null : "Focus or hover to inspect"}</div>
    {series.length > 1 && <div className="ds-row">{series.map(item => <button className="ds-legend" type="button" key={item.name} aria-pressed={!hidden.includes(item.name)} onClick={() => setHidden(old => old.includes(item.name) ? old.filter(name => name !== item.name) : [...old, item.name])}>{item.name}</button>)}</div>}
    <details className="ds-data-details"><summary>View data table</summary><div className="ds-table-scroll"><table><caption>{label}</caption><thead><tr><th scope="col">Sample</th>{series.map(item => <th scope="col" key={item.name}>{item.name}</th>)}</tr></thead><tbody>{Array.from({ length: count }, (_, i) => <tr key={i}><th scope="row">{labels[i] ?? `Sample ${i + 1}`}</th>{series.map(item => <td key={item.name}>{finite(item.data[i]) ? format(item.data[i]) : "Missing"}</td>)}</tr>)}</tbody></table></div></details>
  </figure>;
}
export function Sparkline({ data, label }: { data: Sample[]; label: string }) {
  return <LineChart series={[{ name: label, data }]} labels={data.map((_, i) => String(i + 1))} label={label} />;
}
export function SegmentGauge({ value, label }: { value: number; label: string }) {
  const clamped = clampPercent(value);
  if (clamped === null) return <StateMessage title="Measurement unavailable">{label}</StateMessage>;
  return <div className="ds-gauge-wrap"><span className="wt-label">{label} · {clamped}%</span><div className="ds-gauge" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}><span style={{ width: `${clamped}%` }} /></div></div>;
}
export function UptimeBar({ values, label }: { values: ("up" | "down" | "degraded" | null)[]; label: string }) {
  return <div><p className="wt-label">{label}</p><div className="ds-uptime" role="img" aria-label={values.map((value, i) => `${i + 1}: ${value ?? "Missing"}`).join(", ")}>{values.map((value, i) => <span key={i} data-state={value ?? "missing"} />)}</div><details><summary>View status samples</summary><ol>{values.map((value, i) => <li key={i}>{value ?? "Missing"}</li>)}</ol></details></div>;
}
export function DonutChart({ segments, label, showTotal = false }: { segments: { label: string; value: Sample; tone?: "up" | "down" | "degraded" | "neutral" }[]; label: string; showTotal?: boolean }) {
  const valid = segments.map(segment => ({ ...segment, value: nonnegativeSample(segment.value) }));
  const total = valid.reduce((sum, segment) => sum + (segment.value ?? 0), 0);
  if (!total) return <StateMessage title="No data yet">{label}</StateMessage>;
  return <figure className="ds-donut" data-product={showTotal || undefined}><figcaption>{label}</figcaption><svg viewBox="0 0 100 100" role="img" aria-label={`${label}: ${valid.map(s => `${s.label} ${s.value ?? "Missing"}`).join(", ")}`}>
    {valid.map((segment, i) => { if (segment.value === null) return null; const percent = segment.value / total * 100; const start = valid.slice(0, i).reduce((sum, previous) => sum + (previous.value ?? 0), 0) / total * 100; return <circle key={`${segment.label}-${i}`} cx="50" cy="50" r="36" pathLength="100" fill="none" strokeWidth="10" strokeDasharray={`${percent} ${100 - percent}`} strokeDashoffset={-start} transform="rotate(-90 50 50)" style={{ stroke: segment.tone ? `var(--${segment.tone === "neutral" ? "text-tertiary" : `status-${segment.tone}`})` : `var(--chart-${i === 0 ? "series-primary" : i % 2 ? "series-1" : "series-2"})` } as CSSProperties} />; })}
    {showTotal && <><text className="ds-donut-total" x="50" y="49">{total}</text><text className="ds-donut-label" x="50" y="62">{label}</text></>}
  </svg><ul>{valid.map((segment, i) => <li key={i}>{showTotal && <span className="ds-dot" style={{ color: `var(--${segment.tone === "neutral" || !segment.tone ? "text-tertiary" : `status-${segment.tone}`})` }} />}{segment.label}{showTotal ? " " : ": "}<strong>{segment.value ?? "Missing"}</strong></li>)}</ul></figure>;
}
