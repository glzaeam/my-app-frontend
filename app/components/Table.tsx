import React from 'react';
import '../styles/table.css';

/**
 * Unified Table Component
 * Provides consistent styling, typography, and layout across all tables in the system.
 * Supports standard table, user-focused columns, and status indicators.
 */

interface TableProps {
  columns: {
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
  }[];
  data: Record<string, any>[];
  emptyState?: string;
  isLoading?: boolean;
  className?: string;
  rowClassName?: (row: Record<string, any>) => string;
  renderCell?: (key: string, value: any, row: Record<string, any>) => React.ReactNode;
}

interface UserCellProps {
  name: string;
  email?: string;
  avatar?: string;
  emphasized?: boolean;
}

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending';
  text: string;
  size?: 'sm' | 'md';
}

/**
 * User Cell Component - Standardized display for user-related data
 */
export const UserCell: React.FC<UserCellProps> = ({
  name,
  email,
  avatar,
  emphasized = false,
}) => {
  return (
    <div className={`table-user-cell ${emphasized ? 'emphasized' : ''}`}>
      {avatar && (
        <img
          src={avatar}
          alt={name}
          className="table-user-avatar"
        />
      )}
      <div className="table-user-info">
        <div className="table-user-name">{name}</div>
        {email && <div className="table-user-email">{email}</div>}
      </div>
    </div>
  );
};

/**
 * Status Badge Component - Standardized status indicators
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'md',
}) => {
  return (
    <span className={`table-status-badge status-${status} size-${size}`}>
      <span className="status-dot" />
      {text}
    </span>
  );
};

/**
 * Main Table Component
 */
export const Table: React.FC<TableProps> = ({
  columns,
  data,
  emptyState = 'No data available',
  isLoading = false,
  className = '',
  rowClassName,
  renderCell,
}) => {
  if (isLoading) {
    return (
      <div className={`nexum-table-wrapper ${className}`}>
        <table className="nexum-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="table-loading">Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`nexum-table-wrapper ${className}`}>
        <table className="nexum-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="table-empty-state">{emptyState}</div>
      </div>
    );
  }

  return (
    <div className={`nexum-table-wrapper ${className}`}>
      <table className="nexum-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
                className={col.sortable ? 'sortable' : ''}
              >
                {col.label}
                {col.sortable && <span className="sort-indicator">⇅</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={rowClassName ? rowClassName(row) : ''}
            >
              {columns.map((col) => (
                <td
                  key={`${idx}-${col.key}`}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                >
                  {renderCell
                    ? renderCell(col.key, row[col.key], row)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Compact Table Component - For smaller data displays
 */
interface CompactTableProps extends Omit<TableProps, 'columns'> {
  columns: Array<{
    key: string;
    label: string;
    width?: string;
  }>;
}

export const CompactTable: React.FC<CompactTableProps> = (props) => {
  return <Table {...props} />;
};

export default Table;
