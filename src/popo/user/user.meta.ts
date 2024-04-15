export enum UserType {
  student = 'STUDENT',
  rc_student = 'RC_STUDENT',
  faculty = 'FACULTY', // 교직원
  association = 'ASSOCIATION', // 자치단체 계정
  club = 'CLUB', // 동아리 계정
  admin = 'ADMIN', // POPO 관리자,
  staff = 'STAFF', // placeStaffs
  others = 'OTHERS',
}

export enum UserStatus {
  activated = 'ACTIVATED',
  deactivated = 'DEACTIVATED',
  password_reset = 'PASSWORD_RESET',
  banned = 'BANNED',
}
