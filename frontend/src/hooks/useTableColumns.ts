import { useState, useEffect } from 'react';

export interface ColumnDef {
  id: string;
  label: string;
  isVisible: boolean;
  order: number;
}

export function useTableColumns(tableId: string, defaultColumns: Omit<ColumnDef, 'order'>[]) {
  const storageKey = `plenitude_table_${tableId}`;

  const [columns, setColumns] = useState<ColumnDef[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ColumnDef[];
        // Merge with defaults to ensure new columns are added if codebase changes
        const merged = defaultColumns.map((dc, index) => {
          const found = parsed.find(p => p.id === dc.id);
          if (found) {
            // Always sync the label from code in case we renamed it
            return { ...found, label: dc.label };
          }
          return { ...dc, order: parsed.length + index };
        });
        return merged.sort((a, b) => a.order - b.order);
      } catch (e) {
        console.error("Failed to parse column config", e);
      }
    }
    return defaultColumns.map((c, i) => ({ ...c, order: i }));
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  }, [columns, storageKey]);

  const toggleVisibility = (id: string) => {
    setColumns(cols => cols.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  };

  const moveColumn = (id: string, direction: 'up' | 'down') => {
    setColumns(cols => {
      const idx = cols.findIndex(c => c.id === id);
      if (idx === -1) return cols;
      if (direction === 'up' && idx === 0) return cols;
      if (direction === 'down' && idx === cols.length - 1) return cols;

      const newCols = cols.map(c => ({...c}));
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      
      // Swap orders
      const tempOrder = newCols[idx].order;
      newCols[idx].order = newCols[swapIdx].order;
      newCols[swapIdx].order = tempOrder;

      // Re-sort array
      return newCols.sort((a, b) => a.order - b.order);
    });
  };

  const reorderColumn = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setColumns(cols => {
      const draggedIdx = cols.findIndex(c => c.id === draggedId);
      const targetIdx = cols.findIndex(c => c.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return cols;

      const newCols = cols.map(c => ({...c}));
      const item = newCols.splice(draggedIdx, 1)[0];
      newCols.splice(targetIdx, 0, item);

      // Re-assign orders linearly
      newCols.forEach((c, idx) => {
        c.order = idx;
      });

      return newCols;
    });
  };

  return { columns, toggleVisibility, moveColumn, reorderColumn };
}
