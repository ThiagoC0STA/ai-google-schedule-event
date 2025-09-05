/**
 * @license MIT
 * Timezone and date manipulation utilities using Luxon
 */

import { DateTime, Interval } from "luxon";

/**
 * Convert ISO string to DateTime in specified timezone
 */
export function toDateTime(isoString: string, timezone: string): DateTime {
  return DateTime.fromISO(isoString, { zone: timezone });
}

/**
 * Convert DateTime to ISO string with timezone offset
 */
export function toISOString(dateTime: DateTime): string {
  return dateTime.toISO() || dateTime.toString();
}

/**
 * Get current time in specified timezone
 */
export function now(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

/**
 * Generate time slots for a given day within work hours
 */
export function generateDaySlots(
  date: DateTime,
  workHours: [number, number],
  durationMinutes: number,
  bufferMinutes: number
): Interval[] {
  const slots: Interval[] = [];
  const [startHour, endHour] = workHours;

  const dayStart = date.set({
    hour: startHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const dayEnd = date.set({
    hour: endHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  let currentTime = dayStart;

  while (
    currentTime
      .plus({ minutes: durationMinutes })
      .minus({ minutes: bufferMinutes }) <= dayEnd
  ) {
    const slotStart = currentTime.plus({ minutes: bufferMinutes });
    const slotEnd = currentTime.plus({
      minutes: durationMinutes + bufferMinutes,
    });

    if (slotEnd <= dayEnd) {
      slots.push(Interval.fromDateTimes(slotStart, slotEnd));
    }

    currentTime = currentTime.plus({ minutes: durationMinutes });
  }

  return slots;
}

/**
 * Check if a time slot conflicts with busy periods
 */
export function hasConflict(
  slot: Interval,
  busyPeriods: Array<{ start: string; end: string }>,
  timezone: string
): boolean {
  return busyPeriods.some((period) => {
    const busyStart = DateTime.fromISO(period.start, { zone: timezone });
    const busyEnd = DateTime.fromISO(period.end, { zone: timezone });
    const busyInterval = Interval.fromDateTimes(busyStart, busyEnd);

    return (
      slot.overlaps(busyInterval) ||
      slot.engulfs(busyInterval) ||
      busyInterval.engulfs(slot)
    );
  });
}

/**
 * Filter out past slots and return only future ones
 */
export function filterFutureSlots(
  slots: Interval[],
  currentTime: DateTime
): Interval[] {
  return slots.filter((slot) => slot.start && slot.start > currentTime);
}

/**
 * Generate slots for multiple days
 */
export function generateMultiDaySlots(
  startDate: DateTime,
  days: number,
  workHours: [number, number],
  durationMinutes: number,
  bufferMinutes: number
): Interval[] {
  const allSlots: Interval[] = [];

  for (let i = 0; i < days; i++) {
    const currentDate = startDate.plus({ days: i });
    const daySlots = generateDaySlots(
      currentDate,
      workHours,
      durationMinutes,
      bufferMinutes
    );
    allSlots.push(...daySlots);
  }

  return allSlots;
}
