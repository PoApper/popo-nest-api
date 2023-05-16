export class PasswordChangeRequestDto {
  email: string;
}

export class PasswordChangeDto {
  new_password: string;
  user_token: string;
}
