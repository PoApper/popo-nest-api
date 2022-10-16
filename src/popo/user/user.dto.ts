import { UserStatus, UserType } from './user.meta';

export class CreateUserDto {
  readonly email: string;
  readonly id: string;
  readonly password: string;
  readonly name: string;
  readonly userType: UserType;
}

export class UpdateUserDto {
  readonly email: string;
  readonly id: string;
  readonly name: string;
  readonly userType: UserType;
  readonly userStatus: UserStatus;
}

export class UpdatePasswordDto {
  readonly password: string;
}
