// components/ui/VirtualList.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

interface VirtualListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  height?: number;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}

export const VirtualList = memo(({
  items = [], // ✅ Default to empty array
  renderItem,
  height = 400,
  itemHeight = 80,
  overscan = 3,
  className = "",
  emptyMessage = "No items to display",
}: VirtualListProps) => {
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      setStartIndex(newStartIndex);
    };

    containerRef.current.addEventListener('scroll', handleScroll);
    return () => containerRef.current?.removeEventListener('scroll', handleScroll);
  }, [itemHeight, overscan]);

  useEffect(() => {
    const endIndex = Math.min(safeItems.length, startIndex + Math.ceil(height / itemHeight) + overscan * 2);
    setVisibleItems(safeItems.slice(startIndex, endIndex));
  }, [safeItems, startIndex, height, itemHeight, overscan]);

  // ✅ Handle empty state
  if (safeItems.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const totalHeight = safeItems.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: `${height}px`, contain: 'strict' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: `${offsetY}px`, left: 0, right: 0 }}>
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={actualIndex}
                style={{ height: `${itemHeight}px` }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = "VirtualList";

export default VirtualList;