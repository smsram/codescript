import React from 'react';

export default function Pagination({ currentPage, totalItems, itemsPerPage, onNext, onPrev }) {
  const start = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface, #1e293b)',
      border: '1px solid var(--border-light, #334155)',
      borderRadius: '0.75rem', 
      padding: '1rem',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
        Showing {start} to {end} of {totalItems} entries
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={onPrev} 
          disabled={currentPage === 1}
          style={{
            padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.25rem',
            background: 'transparent', border: '1px solid var(--border-light, #334155)',
            color: currentPage === 1 ? '#475569' : '#94a3b8',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#94a3b8')}
        >
          Previous
        </button>
        <button 
          onClick={onNext} 
          disabled={end >= totalItems}
          style={{
            padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.25rem',
            background: 'transparent', border: '1px solid var(--border-light, #334155)',
            color: end >= totalItems ? '#475569' : '#94a3b8',
            cursor: end >= totalItems ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '#94a3b8')}
        >
          Next
        </button>
      </div>
    </div>
  );
}