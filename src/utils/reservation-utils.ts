import moment from 'moment';

export function calculateReservationDurationMinutes(
  start_time: string,
  end_time: string,
): number {
  const startMoment = moment(start_time, 'hhmm');
  const endMoment = moment(end_time, 'hhmm');
  const momentDiff = moment.duration(endMoment.diff(startMoment));

  return momentDiff.asMinutes();
}
