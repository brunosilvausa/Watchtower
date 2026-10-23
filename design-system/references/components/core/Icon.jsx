import React from 'react';
const CDN = 'https://unpkg.com/lucide-static@0.460.0/icons/';
const cache = {};
function load(name) {
  if (!cache[name]) cache[name] = fetch(CDN + name + '.svg').then(r => r.ok ? r.text() : '').catch(() => '');
  return cache[name];
}
export function Icon({ name, size = 18, color = 'currentColor', strokeWidth, style, title, ...rest }) {
  const sw = strokeWidth ?? +(1.5 * 24 / size).toFixed(2);
  const [svg, setSvg] = React.useState('');
  React.useEffect(() => {
    let live = true;
    load(name).then(t => { if (live) setSvg(t.replace(/<!--[\s\S]*?-->/g, '').replace(/width="24"/, 'width="100%"').replace(/height="24"/, 'height="100%"').replace(/stroke-width="[\d.]+"/, 'stroke-width="' + sw + '"')); });
    return () => { live = false; };
  }, [name, sw]);
  return (
    <span role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} {...rest}
      style={{ display: 'inline-flex', flex: 'none', width: size, height: size, color, lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
