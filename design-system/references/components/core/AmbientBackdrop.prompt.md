Place once at the root of a page so glass surfaces have light to refract. Content above it needs `position: relative; z-index: 1`.
```jsx
<AmbientBackdrop />
<div style={{ position: 'relative', zIndex: 1 }}>…app…</div>
```
Static alternative for plain HTML: `<body class="wt-ambient">`.
Parallax runs on a gentle rAF spring written straight to transforms (no re-renders); off for touch and reduced motion.
