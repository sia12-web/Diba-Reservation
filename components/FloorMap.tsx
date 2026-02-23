"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TableLayoutInfo {
    id: number;
    label: string;
    shape: 'regular' | 'round' | 'large';
    position_x: number;
    position_y: number;
    width: number;
    height: number;
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

const CANVAS_WIDTH = 1100;
const CANVAS_HEIGHT = 950;

export default function FloorMap({
    occupiedTableIds,
    eligibleTableIds,
    selectedTableIds,
    onTableSelect,
    mode,
    showLegend = true
}: FloorMapProps) {
    const [scale, setScale] = useState(1);
    const [tables, setTables] = useState<TableLayoutInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById('floor-map-container');
            if (container) {
                const parentWidth = container.parentElement?.clientWidth || 1100;
                const newScale = Math.min(parentWidth / CANVAS_WIDTH, 1);
                setScale(newScale);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        async function fetchTables() {
            try {
                const res = await fetch('/api/admin/tables');
                if (res.ok) {
                    const data = await res.json();
                    setTables(data);
                }
            } catch (err) {
                console.error('Failed to fetch tables');
            } finally {
                setIsLoading(false);
            }
        }
        fetchTables();
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

    if (isLoading) {
        return <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-3xl animate-pulse text-gray-400 font-serif">Loading floor plan...</div>;
    }

    return (
        <div id="floor-map-container" className="relative mx-auto overflow-x-auto overflow-y-hidden bg-[#FAF7F2]/50 rounded-3xl border border-gray-200 shadow-inner no-scrollbar p-8"
            style={{ width: '100%', maxWidth: CANVAS_WIDTH }}>
            <div style={{
                position: 'relative',
                width: CANVAS_WIDTH * scale,
                height: CANVAS_HEIGHT * scale,
                margin: '0 auto',
                minHeight: CANVAS_HEIGHT * scale
            }}>
                <div style={{
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'absolute'
                }}>
                    {tables.map((table) => {
                        const isOccupied = occupiedTableIds.includes(table.id);
                        const isEligible = eligibleTableIds.includes(table.id);
                        const isSelected = selectedTableIds.includes(table.id);

                        // Purple styling for tables 10, 11, 12, 13, 14
                        const isPrimary = [10, 11, 12, 13, 14].includes(table.id);

                        let state: 'occupied' | 'selected' | 'eligible' | 'ineligible' = 'ineligible';
                        if (isOccupied) state = 'occupied';
                        else if (isSelected) state = 'selected';
                        else if (isEligible || mode === 'admin') state = 'eligible';

                        const baseStyles = "absolute flex flex-col items-center justify-center transition-all duration-300 select-none shadow-sm";

                        const getDynamicStyles = () => {
                            if (state === 'occupied') return "bg-gray-200 text-gray-500 border-none opacity-50";
                            if (state === 'selected') return "bg-[#8B1A1A] text-white border-4 border-[#C4973A] shadow-xl z-20 scale-105";

                            if (state === 'eligible') {
                                if (isPrimary) {
                                    return "bg-[#FDF4FF] text-[#701A75] border-2 border-[#D946EF] cursor-pointer hover:bg-[#FAE8FF] hover:shadow-md";
                                }
                                return "bg-white text-[#1E3A8A] border-2 border-[#3B82F6] cursor-pointer hover:bg-blue-50 hover:shadow-md";
                            }

                            return "bg-gray-50 text-gray-300 border border-gray-100 opacity-40";
                        };

                        return (
                            <motion.div
                                key={table.id}
                                initial={false}
                                whileHover={state === 'eligible' ? { scale: 1.02 } : {}}
                                onClick={() => handleTableClick(table.id)}
                                className={`${baseStyles} ${getDynamicStyles()} ${table.shape === 'round' ? 'rounded-full' : 'rounded-lg'}`}
                                style={{
                                    left: table.position_x,
                                    top: table.position_y,
                                    width: table.width,
                                    height: table.height,
                                }}
                            >
                                <span className="text-sm font-bold">{table.label}</span>
                                <span className="text-[10px] opacity-70 mt-0.5">{table.capacity_min}–{table.capacity_max}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {showLegend && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-3 text-[11px] font-bold z-10">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border-2 border-[#3B82F6] rounded"></div> Standard Table</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#FDF4FF] border-2 border-[#D946EF] rounded"></div> Premium Table</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#8B1A1A] border-2 border-[#C4973A] rounded"></div> Selected</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 rounded"></div> Occupied</div>
                </div>
            )}
        </div>
    );
}
