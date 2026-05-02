# Unified Table System - Quick Reference

## Quick Start

```tsx
import Table, { UserCell, StatusBadge } from '@/app/components/Table';

<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
  ]}
  data={items}
  renderCell={(key, value, row) => {
    if (key === 'user') return <UserCell name={row.name} email={row.email} />;
    if (key === 'status') return <StatusBadge status={value} text={value} />;
    return value;
  }}
/>
```

---

## Column Definition

```tsx
{
  key: 'columnKey',           // Matches data object key
  label: 'Column Label',      // Header text
  width: '200px',             // Optional CSS width
  align: 'left' | 'center' | 'right',  // Text alignment
  sortable: true              // Optional sort icon
}
```

---

## Component API

### `<Table />`

**Props:**
- `columns: ColumnDef[]` — Column configuration
- `data: Record<string, any>[]` — Row data
- `renderCell?: (key, value, row) => ReactNode` — Custom cell rendering
- `rowClassName?: (row) => string` — Dynamic row CSS classes
- `emptyState?: string` — Empty message (default: "No data available")
- `isLoading?: boolean` — Shows loading state
- `className?: string` — Wrapper class

**Row classes available:**
- `disabled` — Grayed out
- `selected` — Highlighted
- `error` — Red tint
- `warning` — Yellow tint
- `success` — Green tint

---

### `<UserCell />`

**Props:**
- `name: string` (required) — User's name
- `email?: string` — User's email
- `avatar?: string` — Avatar image URL
- `emphasized?: boolean` — Bold name

```tsx
<UserCell 
  name="John Doe" 
  email="john@example.com"
  avatar="/avatars/john.jpg"
  emphasized={true}
/>
```

---

### `<StatusBadge />`

**Props:**
- `status: 'success' | 'error' | 'warning' | 'info' | 'pending'` (required)
- `text: string` (required) — Badge text
- `size?: 'sm' | 'md'` — Badge size (default: 'md')

```tsx
<StatusBadge status="success" text="Active" size="md" />
<StatusBadge status="error" text="Inactive" size="sm" />
<StatusBadge status="warning" text="Pending" />
<StatusBadge status="info" text="Review" />
<StatusBadge status="pending" text="Waiting" />
```

---

## CSS Classes for Custom Styling

**Table:**
- `.nexum-table-wrapper` — Main container
- `.nexum-table` — Table element
- `.nexum-table thead` — Header section
- `.nexum-table tbody` — Body section
- `.nexum-table th` — Header cell
- `.nexum-table td` — Data cell

**Special:**
- `.table-empty-state` — Empty state message
- `.table-loading` — Loading animation
- `.sort-indicator` — Sort icon (sortable columns)

**Text alignment:**
```tsx
<td className="numeric">123,456</td>      // Right-aligned
<td className="secondary">Muted text</td> // #6B7280
<td className="muted">Helper text</td>    // #9CA3AF, smaller font
```

---

## Color Palette

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Text Primary | #171717 | `--table-text-primary` |
| Text Secondary | #6B7280 | `--table-text-secondary` |
| Text Tertiary | #9CA3AF | `--table-text-tertiary` |
| Background Primary | #FFFFFF | `--table-bg-primary` |
| Background Secondary | #F8FAFC | `--table-bg-secondary` |
| Border | #E5E7EB | `--table-border-default` |
| Success | #10B981 | `--table-color-success` |
| Error | #EF4444 | `--table-color-error` |
| Warning | #F59E0B | `--table-color-warning` |
| Info | #3B82F6 | `--table-color-info` |
| Pending | #8B5CF6 | `--table-color-pending` |

---

## Common Patterns

### Pagination with Table

```tsx
const itemsPerPage = 10;
const totalPages = Math.ceil(data.length / itemsPerPage);
const paged = useMemo(
  () => data.slice((page - 1) * itemsPerPage, page * itemsPerPage),
  [data, page]
);

<Table columns={columns} data={paged} />
<PaginationControls 
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

### With Search/Filter

```tsx
const [searchTerm, setSearchTerm] = useState('');
const filtered = useMemo(
  () => data.filter(row => 
    row.name.includes(searchTerm) || row.email.includes(searchTerm)
  ),
  [data, searchTerm]
);

<input 
  placeholder="Search..." 
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
<Table columns={columns} data={filtered} />
```

### With Actions Column

```tsx
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Actions' },
];

renderCell={(key, value, row) => {
  if (key === 'actions') return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => handleEdit(row.id)}>Edit</button>
      <button onClick={() => handleDelete(row.id)}>Delete</button>
    </div>
  );
  return value;
}}
```

### Conditional Row Styling

```tsx
rowClassName={(row) => {
  if (row.status === 'error') return 'error';
  if (row.status === 'warning') return 'warning';
  if (row.status === 'success') return 'success';
  if (row.isSelected) return 'selected';
  if (row.isDisabled) return 'disabled';
  return '';
}}
```

---

## Spacing Reference

| Variable | Value | Usage |
|----------|-------|-------|
| `--table-padding-h` | 14px | Horizontal padding |
| `--table-padding-v` | 13px | Vertical padding |
| `--table-header-height` | 40px | Header row height |
| `--table-row-height` | 44px | Data row height |
| `--table-border-radius` | 12px | Corner radius |

---

## Typography

| Variable | Value | Usage |
|----------|-------|-------|
| `--table-font-size-header` | 13px | Column headers |
| `--table-font-size-cell` | 13px | Data cells |
| `--table-font-size-muted` | 12px | Secondary text |
| `--table-font-weight-header` | 600 | Header weight |
| `--table-font-weight-cell` | 400 | Cell weight |

---

## Responsive Breakpoints

- **Desktop**: 1024px+ (full table)
- **Tablet**: 769px-1023px (reduced padding)
- **Mobile**: <768px (horizontal scroll)
- **Card Layout**: <480px (card-based mobile view)

---

## Migration Timeline

1. **Phase 1** (This week):
   - ✅ Create Table component & styles
   - Dashboard tables (4)
   
2. **Phase 2** (Next week):
   - Audit Logs (3 tables)
   - Authentication (5 tables)
   
3. **Phase 3** (Following week):
   - User Management (3 tables)
   - Security & Permissions (2 tables)

---

## Troubleshooting

**Q: Table not showing borders?**
A: Ensure `.nexum-table-wrapper` has `.nexum-table-wrapper` class applied to parent div.

**Q: Colors different from design?**
A: Check CSS variables in `:root` block in `app/styles/table.css`

**Q: Pagination not working?**
A: Pagination is separate component—Table only displays `data` prop slice.

**Q: Custom styles not applying?**
A: Use `.nexum-table` selector to override default styles:
```css
.custom-section .nexum-table td {
  /* your styles */
}
```

---

## Files Reference

| File | Purpose | Size |
|------|---------|------|
| `app/components/Table.tsx` | React component | ~220 lines |
| `app/styles/table.css` | Global CSS | ~550 lines |
| `TABLE_REFACTORING_GUIDE.md` | Full documentation | ~400 lines |
| `QUICK_REFERENCE.md` | This file | ~300 lines |

---

**Total code:** ~1,300 lines to unify 15+ tables with zero duplication! 🎯
