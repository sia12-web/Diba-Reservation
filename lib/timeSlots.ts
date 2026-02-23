export const generateTimeSlots = (date: string): string[] => {
  // Parse YYYY-MM-DD manually to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
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
