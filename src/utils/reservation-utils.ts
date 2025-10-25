export function timeStringToMinutes(time: string, isEnd = false): number {
  // Normalize '0000' at end boundary to represent 24:00 (end of day)
  if (isEnd && time === '0000') {
    return 24 * 60;
  }

  const hours = parseInt(time.slice(0, 2), 10);
  const minutes = parseInt(time.slice(2, 4), 10);
  return hours * 60 + minutes;
}

export function calculateReservationDurationMinutes(
  startTime: string,
  endTime: string,
): number {
  const start = timeStringToMinutes(startTime, false);
  const end = timeStringToMinutes(endTime, true);

  // Assume reservations are within the same calendar day.
  // When end < start, treat end as next day end (should only occur for '0000').
  const duration = end - start;
  return duration >= 0 ? duration : 0;
}
