export const FLOOR_LAYOUT = {
    canvasWidth: 800,
    canvasHeight: 450,
    tables: {
        1: { x: 180, y: 310, w: 90, h: 55, label: 'T1' },
        2: { x: 300, y: 310, w: 90, h: 55, label: 'T2' },
        3: { x: 420, y: 310, w: 90, h: 55, label: 'T3' },
        4: { x: 200, y: 180, w: 80, h: 80, label: 'T4', shape: 'round' },
        5: { x: 310, y: 192, w: 90, h: 55, label: 'T5' },
        6: { x: 430, y: 180, w: 80, h: 80, label: 'T6', shape: 'round' },
        7: { x: 50, y: 310, w: 90, h: 55, label: 'T7' },
        8: { x: 50, y: 192, w: 90, h: 55, label: 'T8' },
        9: { x: 50, y: 30, w: 120, h: 75, label: 'T9' },
        10: { x: 200, y: 40, w: 90, h: 55, label: 'T10' },
        11: { x: 320, y: 30, w: 120, h: 75, label: 'T11' },
        12: { x: 470, y: 40, w: 90, h: 55, label: 'T12' },
        13: { x: 590, y: 30, w: 120, h: 75, label: 'T13' },
        14: { x: 730, y: 30, w: 50, h: 75, label: 'T14' },
    } as Record<number, { x: number, y: number, w: number, h: number, label: string, shape?: 'round' }>
};
