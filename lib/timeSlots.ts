export const generateTimeSlots = (date: string): string[] => {
  // Parse YYYY-MM-DD or MM/DD/YYYY to avoid timezone issues
  let year, month, day;
  if (date.includes('-')) {
    [year, month, day] = date.split('-').map(Number);
  } else {
    // Fallback for other formats like MM/DD/YYYY
    const parts = date.split('/').map(Number);
    if (parts[0] > 1000) { // YYYY/MM/DD
      [year, month, day] = parts;
    } else { // MM/DD/YYYY
      [month, day, year] = parts;
    }
  }
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday and Saturday
  const lastSlot = isWeekend ? "21:00" : "20:30";

  const slots: string[] = [];
  let currentHour = 11;
  let currentMinute = 30;

  while (true) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(timeString);

    if (timeString === lastSlot) break;

    currentMinute += 30;
    if (currentMinute === 60) {
      currentHour += 1;
      currentMinute = 0;
    }
  }

  return slots;
};

export const isWithinOperatingHours = (date: string, time: string): boolean => {
  const slots = generateTimeSlots(date);
  return slots.includes(time);
};
