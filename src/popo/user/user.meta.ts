export enum UserType {
  student = 'STUDENT',
  faculty = 'FACULTY', // placeStaffs
  association = 'ASSOCIATION', // 자치단체 계정
  club = 'CLUB', // 동아리 계정
  admin = 'ADMIN', // POPO 관리자,
  staff = 'STAFF', // placeStaffs
  others = 'OTHERS',
}

export enum UserStatus {
  activated = 'ACTIVATED',
  deactivated = 'DEACTIVATED',
  banned = 'BANNED'
}