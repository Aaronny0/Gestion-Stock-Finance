'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton = ({ className = '', width, height, borderRadius, style }: SkeletonProps) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '100%',
        borderRadius: borderRadius || 'var(--radius-sm)',
        ...style,
      }}
    />
  );
};

export const DashboardSkeleton = () => {
    return (
        <div className="animate-in" style={{ width: '100%' }}>
            <div className="stats-grid">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="stat-card" style={{ display: 'flex', gap: '16px', padding: '22px' }}>
                        <Skeleton width="44px" height="44px" borderRadius="var(--radius-md)" />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Skeleton width="60%" height="16px" />
                            <Skeleton width="40%" height="28px" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid-2">
                 <div className="card">
                    <Skeleton height="300px" />
                 </div>
                 <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Skeleton height="32px" width="40%" style={{ marginBottom: '16px' }} />
                    {[1, 2, 3, 4].map((i) => (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                             <Skeleton width="40%" height="20px" />
                             <Skeleton width="20%" height="20px" />
                         </div>
                    ))}
                 </div>
            </div>
        </div>
    )
}

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) => {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}><Skeleton height="20px" width="60%" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex}>
                                     <Skeleton height="24px" width={colIndex === 0 ? "80%" : "50%"} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
