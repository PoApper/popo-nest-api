export enum ReservationStatus {
  in_process = '심사중',
  accept = '통과',
  reject = '거절',
}

// 일괄 승인 순서. 생성 시각이 같으면 uuid로 정해 관리자 화면의 예측과 같은 순서를 보장한다.
export function compareByCreatedAt(
  a: { createdAt: Date; uuid: string },
  b: { createdAt: Date; uuid: string },
): number {
  const diff = a.createdAt.getTime() - b.createdAt.getTime();
  if (diff !== 0) return diff;
  return a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0;
}
