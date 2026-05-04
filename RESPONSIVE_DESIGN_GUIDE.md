# Responsive Design Guide — Nexum

This guide covers the responsive design system implemented across the Nexum application. All pages are now fully responsive using a **mobile-first approach** with CSS variables, media queries, and utility classes.

---

## 📱 Breakpoints

The app uses standard responsive breakpoints defined as CSS variables in `globals.css`:

| Breakpoint | Size | Device | Use Case |
|---|---|---|---|
| `--breakpoint-sm` | 360px | Mobile (minimum) | iPhone SE, small phones |
| `--breakpoint-md` | 768px | Tablet | iPad, tablets, larger phones |
| `--breakpoint-lg` | 1280px | Desktop | Laptops, monitors |
| `--breakpoint-xl` | 1536px | Large Desktop | Large monitors |

### Media Query Examples

```css
/* Mobile first (no query needed for 360px+) */
.my-element { font-size: 14px; }

/* Tablet and up (768px+) */
@media (min-width: 768px) {
  .my-element { font-size: 16px; }
}

/* Desktop and up (1280px+) */
@media (min-width: 1280px) {
  .my-element { font-size: 18px; }
}

/* Below tablet (max-width: 767px) */
@media (max-width: 767px) {
  .my-element { font-size: 13px; }
}
```

---

## 🎨 CSS Variables for Responsive Design

All responsive values use CSS variables with `clamp()` for fluid scaling:

### Font Sizes (Automatically Scale)
```css
--font-size-xs: clamp(11px, 2vw, 12px);      /* Small text */
--font-size-sm: clamp(12px, 2.2vw, 13px);    /* Labels, captions */
--font-size-base: clamp(13px, 2.4vw, 14px);  /* Body text */
--font-size-lg: clamp(14px, 2.6vw, 16px);    /* Larger body */
--font-size-xl: clamp(16px, 3vw, 18px);      /* Headings 4 */
--font-size-2xl: clamp(18px, 3.5vw, 22px);   /* Headings 3 */
--font-size-3xl: clamp(22px, 4.5vw, 28px);   /* Headings 2 */
```

### Spacing (Automatically Scale)
```css
--spacing-xs: clamp(4px, 1vw, 8px);           /* Minimal gaps */
--spacing-sm: clamp(8px, 1.5vw, 12px);        /* Small padding */
--spacing-md: clamp(12px, 2vw, 16px);         /* Standard padding */
--spacing-lg: clamp(16px, 2.5vw, 24px);       /* Large padding */
--spacing-xl: clamp(24px, 3vw, 32px);         /* Extra-large padding */
```

### Using These Variables

```jsx
// In a component
<div style={{ 
  fontSize: 'var(--font-size-lg)',
  padding: 'var(--spacing-md)',
  gap: 'var(--spacing-sm)'
}}>
  Responsive content
</div>
```

---

## 🚀 Responsive Utility Classes

Ready-made utility classes for common responsive patterns:

### Grid Utilities

#### `grid-responsive` — Auto-layouts grid
- **Mobile**: 1 column
- **Tablet (768px+)**: 2 columns
- **Desktop (1280px+)**: Auto-fit (3+ columns)

```jsx
<div className="grid-responsive">
  <Card />
  <Card />
  <Card />
</div>
```

### Flexbox Utilities

#### `flex-responsive` — Responsive direction
- **Mobile**: `flex-direction: column` (stack vertically)
- **Tablet (768px+)**: `flex-direction: row` (side-by-side)

```jsx
<div className="flex-responsive gap-responsive">
  <Button />
  <Button />
</div>
```

### Visibility Utilities

#### `hide-mobile` — Hide on mobile, show on tablet+
```jsx
<div className="hide-mobile">
  {/* Only visible on tablets and desktops */}
</div>
```

#### `show-mobile` — Show on mobile, hide on tablet+
```jsx
<div className="show-mobile">
  {/* Only visible on mobile */}
</div>
```

### Spacing Utilities

#### `px-responsive` — Responsive horizontal padding
- **Mobile**: `padding: 0 var(--spacing-sm)`
- **Tablet+**: `padding: 0 var(--spacing-lg)`

```jsx
<div className="px-responsive">
  Content with responsive padding
</div>
```

#### `gap-responsive` — Responsive gap/spacing
- **Mobile**: `gap: var(--spacing-sm)`
- **Tablet**: `gap: var(--spacing-md)`
- **Desktop**: `gap: var(--spacing-lg)`

```jsx
<div className="flex-responsive gap-responsive">
  {/* Children will have responsive gap */}
</div>
```

### Typography Utilities

```jsx
<p className="text-responsive-sm">Small text</p>
<p className="text-responsive-base">Body text</p>
<p className="text-responsive-lg">Large text</p>
<p className="text-responsive-xl">Extra large text</p>
```

### Table Scrolling

#### `table-scroll-mobile` — Horizontal scroll on mobile only
```jsx
<div className="table-scroll-mobile">
  <table>
    {/* Table will scroll horizontally on mobile */}
  </table>
</div>
```

### Modal/Dialog Utilities

#### `modal-responsive` — Full-screen on mobile, normal size on tablet+
- **Mobile**: Full screen (100vw × 100vh), no border radius
- **Tablet+**: 90vw width, max 600px, border radius 12px

```jsx
<dialog className="modal-responsive">
  {/* Modal content */}
</dialog>
```

---

## 🎯 Component Updates

### Sidebar
✅ **Already Updated**

**Features:**
- Hamburger menu button on mobile (appears at `max-width: 768px`)
- Slides in from left as an overlay on mobile
- Touch-friendly spacing on small screens
- Auto-closes when navigating

**Usage:** No changes needed, automatically responsive.

### TopBar
✅ **Already Updated**

**Features:**
- Hamburger menu button on mobile (shows/hides sidebar)
- Responsive title sizing
- Profile info hidden on mobile (role text hidden)
- Touch-friendly button sizes (44px+ on mobile)

**Usage:** Updated to accept `onSidebarToggle` and `sidebarOpen` props:

```jsx
<TopBar 
  title="Dashboard" 
  onSidebarToggle={setSidebarOpen}
  sidebarOpen={sidebarOpen}
/>
```

### Tables
✅ **Already Updated**

**Features:**
- Horizontal scroll on tablets (768px-1279px)
- Compact padding on mobile
- Responsive font sizes
- Touch-friendly scrolling (`-webkit-overflow-scrolling: touch`)

**Usage:** Tables automatically respond. No changes needed.

### Cards & Grids

Use the `grid-responsive` utility class:

```jsx
<div className="grid-responsive">
  <div className="card">Card 1</div>
  <div className="card">Card 2</div>
  <div className="card">Card 3</div>
</div>
```

**Behavior:**
- 1 column on mobile (360px)
- 2 columns on tablet (768px)
- 3+ columns on desktop (1280px)

### Forms & Buttons

Make buttons and inputs full-width on mobile:

```jsx
<div className="flex-responsive">
  <button className="btn-mobile-full">Submit</button>
  <button className="btn-mobile-full">Cancel</button>
</div>

<input className="input-mobile-full" placeholder="Enter text" />
```

**Behavior:**
- Full width (100%) on mobile
- Auto width on tablet+

---

## 📋 Best Practices

### 1. **Mobile-First Approach**
Always start with mobile styles first, then add complexity for larger screens:

```css
/* Mobile (default) */
.card { width: 100%; padding: 12px; }

/* Tablet and up */
@media (min-width: 768px) {
  .card { width: 48%; }
}

/* Desktop and up */
@media (min-width: 1280px) {
  .card { width: 30%; }
}
```

### 2. **Use CSS Variables for Sizes**
Instead of hard-coded values, use responsive variables:

```jsx
// ❌ Bad
<div style={{ fontSize: '18px', padding: '20px' }}>
  Content
</div>

// ✅ Good
<div style={{ 
  fontSize: 'var(--font-size-lg)',
  padding: 'var(--spacing-lg)'
}}>
  Content
</div>
```

### 3. **Use Utility Classes**
Combine utility classes for consistent responsive behavior:

```jsx
// ✅ Good
<div className="flex-responsive gap-responsive px-responsive">
  <Card />
  <Card />
</div>
```

### 4. **Test on Real Devices**
Use Chrome DevTools (F12) → Toggle device toolbar to test different screen sizes:
- iPhone SE (375px)
- iPad (768px)
- iPad Pro (1024px)
- Desktop (1280px+)

### 5. **Handle Touch on Mobile**
- Use touch-friendly button sizes (44px minimum)
- Increase tap targets for easier interaction
- Avoid hover-only interactions on mobile

```css
/* Touch-friendly on mobile */
@media (max-width: 768px) {
  .btn {
    min-height: 44px;
    padding: 12px 16px;
  }
}
```

### 6. **Responsive Images**
Use `object-fit` for responsive images:

```jsx
<img 
  src="image.jpg" 
  style={{
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  }}
  alt="Description"
/>
```

### 7. **Hide/Show Content Wisely**
Use `hide-mobile` and `show-mobile` for critical content only:

```jsx
{/* Desktop navigation */}
<nav className="hide-mobile">
  {/* Full navigation menu */}
</nav>

{/* Mobile hamburger menu */}
<button className="show-mobile">Menu</button>
```

---

## 🔧 Implementation Examples

### Example 1: Responsive Card Grid

```jsx
<div className="grid-responsive gap-responsive">
  {users.map(user => (
    <div key={user.id} className="card" style={{ padding: 'var(--spacing-lg)' }}>
      <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{user.name}</h3>
      <p style={{ fontSize: 'var(--font-size-sm)' }}>{user.email}</p>
      <button className="btn-mobile-full">View Details</button>
    </div>
  ))}
</div>
```

**Result:**
- Mobile: 1 column, full-width buttons
- Tablet: 2 columns, full-width buttons
- Desktop: 3+ columns, inline buttons

### Example 2: Responsive Form

```jsx
<form className="container-responsive">
  <div className="grid-responsive" style={{ marginBottom: 'var(--spacing-lg)' }}>
    <input 
      className="input-mobile-full"
      placeholder="First Name"
      style={{ fontSize: 'var(--font-size-base)' }}
    />
    <input 
      className="input-mobile-full"
      placeholder="Last Name"
      style={{ fontSize: 'var(--font-size-base)' }}
    />
  </div>
  
  <button className="btn-mobile-full" style={{ height: 'var(--mobile-button-height)' }}>
    Submit
  </button>
</form>
```

### Example 3: Responsive Table

```jsx
<div className="table-scroll-mobile">
  <table className="nexum-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {/* Table rows */}
    </tbody>
  </table>
</div>
```

**Result:**
- Mobile/Tablet: Horizontal scroll
- Desktop: No scroll, full width

---

## 🐛 Troubleshooting

### Issue: Content not responsive
**Solution:** Make sure to use `var(--spacing-*)` and `var(--font-size-*)` variables instead of hard-coded sizes.

### Issue: Sidebar overlapping content on mobile
**Solution:** This is intentional! The sidebar is an overlay on mobile. Click the hamburger button or overlay to close it.

### Issue: Tables not scrolling on mobile
**Solution:** Wrap table in `table-scroll-mobile` class or `<div style={{ overflowX: 'auto' }}>`.

### Issue: Buttons too small on mobile
**Solution:** Use `btn-mobile-full` class and ensure min height is 44px: `height: var(--mobile-button-height)`.

---

## 📚 Summary Table

| Feature | Mobile (360px) | Tablet (768px) | Desktop (1280px) |
|---|---|---|---|
| **Sidebar** | Hamburger menu (overlay) | Hamburger menu (overlay) | Fixed sidebar (268px) |
| **TopBar Height** | 56px | 60px | 66px |
| **Grid Columns** | 1 | 2 | 3+ |
| **Font Sizes** | Small (scale down) | Medium | Large |
| **Buttons** | Full width | Inline | Inline |
| **Tables** | Horizontal scroll | Horizontal scroll | No scroll |
| **Modals** | Full screen | 90vw, max 600px | 90vw, max 600px |
| **Padding** | 12px-16px | 16px-24px | 24px-32px |

---

## 🔗 Related Files

- [globals.css](app/globals.css) — CSS variables and utility classes
- [Sidebar.tsx](app/components/Sidebar.tsx) — Responsive sidebar component
- [TopBar.tsx](app/components/TopBar.tsx) — Responsive top bar with hamburger
- [table.css](app/styles/table.css) — Responsive table styles
- [dashboard/page.tsx](app/dashboard/page.tsx) — Responsive layout example

---

**Last Updated:** May 2026  
**Maintained by:** Development Team
