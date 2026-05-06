// TODO: reserve.place.entity 의 endTime이 0000 이 아닌 2400으로 저장된다면 이 함수 지워도 됨
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

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function getWeekdayFromDate(date: string): (typeof WEEKDAYS)[number] | null {
  if (!/^\d{8}$/.test(date)) {
    return null;
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return WEEKDAYS[parsed.getUTCDay()];
}

function openingTimeToMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours === 24 && minutes === 0) {
    return 24 * 60;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function getOpeningRangesMinutes(
  openingHours: string,
  date: string,
): Array<[number, number]> | null {
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(openingHours);
  } catch {
    return null;
  }

  const weekday = getWeekdayFromDate(date);
  if (!weekday) {
    return null;
  }

  const targetOpeningHours = parsed.Everyday ?? parsed[weekday];
  if (typeof targetOpeningHours !== 'string' || !targetOpeningHours.trim()) {
    return null;
  }

  const ranges: Array<[number, number]> = [];
  const rangeTexts = targetOpeningHours
    .split(',')
    .flatMap((rangeText) => rangeText.split('&'));

  for (const rangeText of rangeTexts) {
    const [startText, endText, ...rest] = rangeText
      .trim()
      .split('-')
      .map((text) => text.trim());

    if (!startText || !endText || rest.length > 0) {
      return null;
    }

    const openStart = openingTimeToMinutes(startText);
    const openEnd = openingTimeToMinutes(endText);
    if (openStart === null || openEnd === null || openStart >= openEnd) {
      return null;
    }

    ranges.push([openStart, openEnd]);
  }

  return ranges.length ? ranges : null;
}

export function isOnOpeningHours(
  openingHours: string,
  date: string,
  startTime: string,
  endTime: string,
): boolean {
  const reservationStart = timeStringToMinutes(startTime, false);
  const reservationEnd = timeStringToMinutes(endTime, true);
  if (
    !Number.isFinite(reservationStart) ||
    !Number.isFinite(reservationEnd) ||
    reservationStart >= reservationEnd
  ) {
    return false;
  }

  const openingRanges = getOpeningRangesMinutes(openingHours, date);
  if (!openingRanges) {
    return false;
  }

  return openingRanges.some(
    ([openStart, openEnd]) =>
      openStart <= reservationStart && reservationEnd <= openEnd,
  );
}
