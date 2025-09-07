import * as moment from 'moment';

export function calculateReservationDurationMinutes(
  startTime: string,
  endTime: string,
): number {
  const startMoment = moment(startTime, 'HHmm');
  const endMoment = moment(endTime, 'HHmm');
  const momentDiff = moment.duration(endMoment.diff(startMoment));

  return momentDiff.asMinutes();
}
