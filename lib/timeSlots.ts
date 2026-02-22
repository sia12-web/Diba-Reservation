export const generateTimeSlots = (date: string): string[] => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  
  const isWeekend = day === 5 || day === 6; // Friday and Saturday
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
