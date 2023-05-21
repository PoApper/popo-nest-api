export class PasswordChangeRequestDto {
  email: string;
}

export class PasswordChangeDto {
  new_password: string;
  change_request_uuid: string;
}
