
import { startOfYear, addDays, format, getWeek, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

export interface CalendarWeek {
  week: number;
  startDate: Date;
  endDate: Date;
  label: string;
  value: string;
}

export const generateCalendarWeeks = (year: number): CalendarWeek[] => {
  const weeks: CalendarWeek[] = [];
  const yearStart = startOfYear(new Date(year, 0, 1));
  
  // Get the first week that belongs to this year
  let currentDate = yearStart;
  const maxWeeks = isLeapYear(year) ? 53 : 52;
  
  for (let weekNum = 1; weekNum <= maxWeeks; weekNum++) {
    // Find the first day of this week number in the year
    while (getWeek(currentDate, { weekStartsOn: 1, locale: de }) !== weekNum || 
           currentDate.getFullYear() !== year) {
      currentDate = addDays(currentDate, 1);
      // Safety check to prevent infinite loop
      if (currentDate.getFullYear() > year) {
        return weeks;
      }
    }
    
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    // Only include weeks that start in the target year or are the first week
    if (weekStart.getFullYear() === year || weekNum === 1) {
      const startDateStr = format(weekStart, 'dd.MM.yyyy', { locale: de });
      const endDateStr = format(weekEnd, 'dd.MM.yyyy', { locale: de });
      const label = `KW ${weekNum} (${startDateStr} - ${endDateStr})`;
      
      weeks.push({
        week: weekNum,
        startDate: weekStart,
        endDate: weekEnd,
        label,
        value: `KW${weekNum}-${year}`
      });
    }
    
    currentDate = addDays(currentDate, 7);
  }
  
  return weeks;
};

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const parseCalendarWeekValue = (value: string): { week: number; year: number } | null => {
  const match = value.match(/^KW(\d+)-(\d+)$/);
  if (match) {
    return {
      week: parseInt(match[1], 10),
      year: parseInt(match[2], 10)
    };
  }
  return null;
};
