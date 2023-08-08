import * as moment from 'moment';

export function calculateReservationDurationMinutes(
  start_time: string,
  end_time: string,
): number {
  const startMoment = moment(start_time, 'HHmm');
  const endMoment = moment(end_time, 'HHmm');
  const momentDiff = moment.duration(endMoment.diff(startMoment));

  return momentDiff.asMinutes();
}
