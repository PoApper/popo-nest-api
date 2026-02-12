import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
export class PopoSettingDto {
  readonly popo_crm_mail: string; // CRM = 고객 관계 관리
  readonly stu_email: string; // 총학 이메일: stu-xx@postech.ac.kr
  readonly stu_president_name: string; // 총학생회장 이름
  readonly stu_president_contact: string; // 총학생회장 연락처: ex. +82-10-xxxx-xxxx
  readonly stu_tel: string; // 총학생회 전화번호: ex. +82-54-279-2621
  readonly stu_fax: string; // 총학생회 팩스: ex. +82-54-279-2626
  readonly donyeon_bank: string; // ex. 카카오뱅크 12345-6789-10 (홍길동)
  readonly dongyeon_service_time: string; // ex. 학기중 평일 12:30 ~ 13:30
  readonly dongyeon_contact: string; // ex. (운영관리부) 0xx-xxxx-xxxx
}

export class RcStudentsListDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10 Mb
  readonly csv_file: MemoryStoredFile;
}
