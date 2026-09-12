import React, { useState, useRef, useEffect } from 'react';
import { Settings, ArrowUp, ArrowDown, CheckSquare, Square, GripVertical } from 'lucide-react';
import type { ColumnDef } from '../hooks/useTableColumns';

interface Props {
  columns: ColumnDef[];
  onToggle: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onReorder?: (draggedId: string, targetId: string) => void;
}

export function ColumnManager({ columns, onToggle, onMove, onReorder }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id && onReorder) {
      onReorder(draggedId, id);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors text-sm font-medium"
      >
        <Settings size={16} /> Columns
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Manage Columns</span>
          </div>
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {columns.map((col, idx) => (
              <div 
                key={col.id} 
                draggable={!!onReorder}
                onDragStart={(e) => handleDragStart(e, col.id)}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-2 rounded transition-colors group cursor-grab active:cursor-grabbing ${draggedId === col.id ? 'opacity-50 bg-gray-100' : 'hover:bg-blue-50'} ${dragOverId === col.id && draggedId !== col.id ? 'border-t-2 border-blue-500 bg-blue-50' : 'border-t-2 border-transparent'}`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical size={14} className="text-gray-300 group-hover:text-gray-500" />
                  <button
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(col.id);
                    }}
                  >
                    {col.isVisible ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} className="text-gray-400" />
                    )}
                    <span className={`text-sm ${col.isVisible ? 'text-gray-800 font-semibold' : 'text-gray-500 line-through'}`}>
                      {col.label}
                    </span>
                  </button>
                </div>
                
                <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                  <button 
                    disabled={idx === 0}
                    onClick={(e) => { e.stopPropagation(); onMove(col.id, 'up'); }} 
                    className="p-1 bg-gray-100 rounded text-gray-600 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    disabled={idx === columns.length - 1}
                    onClick={(e) => { e.stopPropagation(); onMove(col.id, 'down'); }} 
                    className="p-1 bg-gray-100 rounded text-gray-600 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
             <span className="text-[10px] text-gray-400">Drag items or use arrows to reorder</span>
          </div>
        </div>
      )}
    </div>
  );
}
