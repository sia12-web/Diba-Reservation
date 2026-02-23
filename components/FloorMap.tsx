"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOOR_LAYOUT } from '@/lib/floorLayout';

interface TableInfo {
    id: number;
    capacity_min: number;
    capacity_max: number;
}

interface FloorMapProps {
    occupiedTableIds: number[];
    eligibleTableIds: number[];
    selectedTableIds: number[];
    onTableSelect: (tableIds: number[]) => void;
    mode: 'customer' | 'admin';
    showLegend?: boolean;
}

export default function FloorMap({
    occupiedTableIds,
    eligibleTableIds,
    selectedTableIds,
    onTableSelect,
    mode,
    showLegend = true
}: FloorMapProps) {
    const [scale, setScale] = useState(1);
    const [tableDetails, setTableDetails] = useState<Record<number, TableInfo>>({});

    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById('floor-map-container');
            if (container) {
                const parentWidth = container.parentElement?.clientWidth || 800;
                const newScale = Math.min(parentWidth / FLOOR_LAYOUT.canvasWidth, 1);
                setScale(newScale);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        async function fetchTableDetails() {
            try {
                const res = await fetch('/api/admin/tables'); // Fixed API path
                if (res.ok) {
                    const data = await res.json();
                    const map: Record<number, TableInfo> = {};
                    data.forEach((t: any) => map[t.id] = t);
                    setTableDetails(map);
                }
            } catch (err) {
                console.error('Failed to fetch table details');
            }
        }
        fetchTableDetails();
    }, []);

    const handleTableClick = (id: number) => {
        if (mode === 'admin') {
            onTableSelect([id]);
            return;
        }
        if (!eligibleTableIds.includes(id) && mode === 'customer') return;
        if (occupiedTableIds.includes(id)) return;
        onTableSelect([id]);
    };

    return (
        <div id="floor-map-container" className="relative mx-auto overflow-x-auto overflow-y-hidden bg-white/50 rounded-3xl border border-dashed border-gray-300 shadow-inner no-scrollbar"
            style={{ width: '100%', maxWidth: FLOOR_LAYOUT.canvasWidth }}>
            <div style={{
                position: 'relative',
                width: FLOOR_LAYOUT.canvasWidth * scale,
                height: FLOOR_LAYOUT.canvasHeight * scale,
                margin: '0 auto',
                minHeight: FLOOR_LAYOUT.canvasHeight * scale
            }}>
                <div style={{
                    width: FLOOR_LAYOUT.canvasWidth,
                    height: FLOOR_LAYOUT.canvasHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'absolute'
                }}>
                    {Object.entries(FLOOR_LAYOUT.tables).map(([idStr, layout]) => {
                        const id = parseInt(idStr);
                        const isOccupied = occupiedTableIds.includes(id);
                        const isEligible = eligibleTableIds.includes(id);
                        const isSelected = selectedTableIds.includes(id);
                        const details = tableDetails[id];

                        let state: 'occupied' | 'selected' | 'eligible' | 'ineligible' = 'ineligible';
                        if (isOccupied) state = 'occupied';
                        else if (isSelected) state = 'selected';
                        else if (isEligible || mode === 'admin') state = 'eligible';

                        const baseStyles = "absolute flex flex-col items-center justify-center transition-all duration-200 text-[10px] font-bold select-none";
                        const stateStyles = {
                            occupied: "bg-gray-600 text-white border-none",
                            selected: "bg-[#8B1A1A] text-white border-2 border-[#C4973A] shadow-lg",
                            eligible: "bg-[#FAF7F2] text-[#8B1A1A] border-2 border-[#8B1A1A] hover:bg-[#F3EFE8] hover:border-[#C4973A] hover:shadow-md cursor-pointer",
                            ineligible: "bg-gray-100 text-gray-400 border-2 border-gray-200 opacity-60"
                        };

                        return (
                            <motion.div
                                key={id}
                                initial={false}
                                animate={{ scale: isSelected ? 1.05 : 1 }}
                                onClick={() => handleTableClick(id)}
                                className={`${baseStyles} ${stateStyles[state]} ${layout.shape === 'round' ? 'rounded-full' : 'rounded-xl'}`}
                                style={{
                                    left: layout.x,
                                    top: layout.y,
                                    width: layout.w,
                                    height: layout.h,
                                }}
                            >
                                <span>{layout.label}</span>
                                {details && (
                                    <span className="text-[8px] opacity-80">{details.capacity_min}–{details.capacity_max}</span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {showLegend && (
                <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 text-[10px] font-semibold">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#FAF7F2] border border-[#8B1A1A] rounded-sm"></div> Available</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#8B1A1A] border border-[#C4973A] rounded-sm"></div> Selected</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-600 rounded-sm"></div> Occupied</div>
                </div>
            )}
        </div>
    );
}
