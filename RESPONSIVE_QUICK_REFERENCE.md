# Responsive Design Checklist — Quick Reference

Use this checklist when building new pages or updating existing ones to ensure full responsiveness.

---

## ✅ Quick Setup for New Pages

### 1. **Layout Structure**
```jsx
'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';

export default function NewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('menu-id');

  const styles = `
    .page-root { display: flex; height: 100vh; }
    .page-content { flex: 1; display: flex; flex-direction: column; }
    .page-scroll { flex: 1; overflow-y: auto; padding: 32px 36px; }
    
    @media (max-width: 768px) { .page-scroll { padding: 18px; } }
    @media (max-width: 480px) { .page-scroll { padding: 14px; } }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="page-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => { /* handle logout */ }}
        />
        <div className="page-content">
          <TopBar 
            title="Page Title"
            onSidebarToggle={setSidebarOpen}
            sidebarOpen={sidebarOpen}
          />
          <div className="page-scroll">
            {/* Your page content here */}
          </div>
        </div>
      </div>
    </>
  );
}
```

---

## 📋 Component Responsiveness Checklist

### ✅ Typography
- [ ] Use `var(--font-size-*)` variables for all text sizes
- [ ] Use `fontSize: 'var(--font-size-base)'` in inline styles
- [ ] Headings scale automatically with viewport
- [ ] Test readability on mobile (minimum 12px)

```jsx
<h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Title</h1>
<p style={{ fontSize: 'var(--font-size-base)' }}>Body text</p>
<small style={{ fontSize: 'var(--font-size-sm)' }}>Caption</small>
```

### ✅ Spacing & Padding
- [ ] Use `var(--spacing-*)` variables for padding/margins
- [ ] Use `gap-responsive` for gaps between items
- [ ] Use `px-responsive` for horizontal padding
- [ ] Reduce padding on mobile (automatically handled)

```jsx
<div style={{ 
  padding: 'var(--spacing-lg)',
  gap: 'var(--spacing-md)'
}}>
  Content
</div>
```

### ✅ Grid & Flexbox
- [ ] Use `grid-responsive` for multi-column layouts
- [ ] Use `flex-responsive` for stacking on mobile
- [ ] Use `gap-responsive` for consistent spacing
- [ ] Test: Mobile (1 col) → Tablet (2 col) → Desktop (3+ col)

```jsx
<div className="grid-responsive gap-responsive">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

### ✅ Forms & Inputs
- [ ] Use `input-mobile-full` for mobile-width inputs
- [ ] Use `btn-mobile-full` for full-width buttons
- [ ] Ensure button height is `var(--mobile-button-height)` (44px)
- [ ] Use `flex-responsive` for form fields

```jsx
<form>
  <input className="input-mobile-full" />
  <button className="btn-mobile-full">Submit</button>
</form>
```

### ✅ Cards & Containers
- [ ] Use `container-responsive` for content containers
- [ ] Use `grid-responsive` for card grids
- [ ] Test: All content visible on mobile without truncation
- [ ] Card width adjusts automatically

```jsx
<div className="container-responsive">
  <div className="grid-responsive">
    {/* Cards here */}
  </div>
</div>
```

### ✅ Tables
- [ ] Wrap in `table-scroll-mobile` class
- [ ] Tables automatically scroll horizontally on mobile
- [ ] No changes needed, works out of the box

```jsx
<div className="table-scroll-mobile">
  <table className="nexum-table">
    {/* Table content */}
  </table>
</div>
```

### ✅ Modals & Dialogs
- [ ] Use `modal-responsive` class
- [ ] Full-screen on mobile (0 radius)
- [ ] Centered on tablet+ (max 600px)
- [ ] Test overlay touch outside to close

```jsx
<dialog className="modal-responsive">
  <h2>Modal Title</h2>
  <p>Modal content</p>
</dialog>
```

### ✅ Visibility
- [ ] Use `hide-mobile` to hide desktop content on mobile
- [ ] Use `show-mobile` to show mobile-specific content
- [ ] Test: Content visible on appropriate screen sizes

```jsx
<nav className="hide-mobile">{/* Desktop nav */}</nav>
<button className="show-mobile">Menu</button>
```

---

## 🎨 Responsive Styles Template

```jsx
const styles = `
  /* ─── DESKTOP (1280px+) ─── */
  .my-component {
    display: flex;
    gap: 24px;
    padding: 32px;
    grid-template-columns: repeat(3, 1fr);
  }

  /* ─── TABLET (768px - 1279px) ─── */
  @media (max-width: 1279px) {
    .my-component {
      gap: 16px;
      padding: 24px;
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* ─── MOBILE (max-width: 768px) ─── */
  @media (max-width: 768px) {
    .my-component {
      gap: 12px;
      padding: 16px;
      grid-template-columns: 1fr;
    }
  }

  /* ─── SMALL MOBILE (max-width: 480px) ─── */
  @media (max-width: 480px) {
    .my-component {
      gap: 8px;
      padding: 12px;
    }
  }
`;
```

---

## 🧪 Testing Checklist

### Device Breakpoints to Test
- [ ] Mobile: 360px (iPhone SE), 375px (iPhone), 414px (iPhone Plus)
- [ ] Tablet: 768px (iPad), 1024px (iPad Pro)
- [ ] Desktop: 1280px (Laptop), 1920px (Desktop Monitor)

### Mobile Interactions
- [ ] All buttons are at least 44px tall and 44px wide
- [ ] No text is too small to read (min 12px)
- [ ] No horizontal scrolling needed on main content
- [ ] Forms work with touch keyboard
- [ ] Modals close properly on mobile

### Viewport Testing
- [ ] Use Chrome DevTools (F12) → Responsive Design Mode
- [ ] Test in portrait and landscape
- [ ] Test with different zoom levels (100%, 125%, 150%)
- [ ] Check on real devices if possible

### Content Testing
- [ ] Long text doesn't overflow containers
- [ ] Images scale properly
- [ ] Tables scroll horizontally (not break)
- [ ] Cards stack vertically on mobile
- [ ] Navigation is accessible on mobile

---

## 📱 Responsive Breakpoint Values

```css
/* In media queries, use these exact values: */

/* Maximum width queries (Mobile & Tablet) */
@media (max-width: 479px)   { /* Extra small mobile */ }
@media (max-width: 767px)   { /* Mobile & tablet cutoff */ }
@media (max-width: 1023px)  { /* Tablet & desktop cutoff */ }
@media (max-width: 1279px)  { /* Tablet & desktop cutoff */ }

/* Minimum width queries (Progressive Enhancement) */
@media (min-width: 360px)   { /* Mobile */ }
@media (min-width: 768px)   { /* Tablet */ }
@media (min-width: 1024px)  { /* Large tablet */ }
@media (min-width: 1280px)  { /* Desktop */ }
@media (min-width: 1536px)  { /* Large desktop */ }
```

---

## 🎯 Common Responsive Patterns

### Pattern 1: Responsive Grid
```jsx
<div className="grid-responsive gap-responsive">
  <Card />
  <Card />
  <Card />
</div>
```
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3+ columns

### Pattern 2: Responsive Form
```jsx
<form className="flex-responsive gap-responsive">
  <input className="input-mobile-full" />
  <button className="btn-mobile-full">Submit</button>
</form>
```
- Mobile: Stack vertically, full-width
- Tablet+: Side-by-side

### Pattern 3: Hide Desktop, Show Mobile
```jsx
<>
  <div className="hide-mobile">Desktop content</div>
  <div className="show-mobile">Mobile content</div>
</>
```

### Pattern 4: Responsive Padding Container
```jsx
<div className="container-responsive px-responsive">
  {/* Content auto-adjusts padding based on screen size */}
</div>
```

### Pattern 5: Responsive Typography
```jsx
<div>
  <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Title</h1>
  <p style={{ fontSize: 'var(--font-size-base)' }}>Subtitle</p>
</div>
```

---

## 🚀 Do's and Don'ts

| ✅ DO | ❌ DON'T |
|---|---|
| Use `var(--spacing-*)` | Hard-code padding like `padding: 20px` |
| Use `var(--font-size-*)` | Hard-code font sizes like `fontSize: 18px` |
| Use `@media (max-width: 768px)` | Use unclear breakpoints like `@media (max-width: 700px)` |
| Test on multiple devices | Only test on desktop |
| Stack on mobile, expand on desktop | Squeeze everything into mobile |
| Use `gap-responsive` for spacing | Manual gap adjustments per breakpoint |
| Test touch on mobile | Only test mouse clicks |
| Make buttons 44px+ tall | Make tiny buttons hard to tap |

---

## 🔗 Quick Links

- [RESPONSIVE_DESIGN_GUIDE.md](RESPONSIVE_DESIGN_GUIDE.md) — Full documentation
- [globals.css](app/globals.css) — CSS variables & utilities
- [Sidebar.tsx](app/components/Sidebar.tsx) — Mobile-first sidebar
- [TopBar.tsx](app/components/TopBar.tsx) — Hamburger menu
- [table.css](app/styles/table.css) — Responsive tables

---

## ❓ FAQ

**Q: Do I need to update all existing pages?**  
A: Only if they have responsiveness issues. New pages should use this approach from the start.

**Q: Can I use Tailwind classes instead?**  
A: Yes, but the project uses CSS variables & inline styles. Mix them if needed, but prefer consistency.

**Q: How do I test if my changes are responsive?**  
A: Use Chrome DevTools → Responsive Design Mode (F12) → Select device.

**Q: What if my component needs custom responsive logic?**  
A: Use media queries in your component's style block or CSS file following the template above.

**Q: Do I need to update the sidebar on every page?**  
A: No, use the dashboard/page.tsx as a template. Copy-paste the structure and update the content.

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** ✅ Ready for use
