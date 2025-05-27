import { UserType } from '../../popo/user/user.meta';

export class JwtPayload {
  uuid: string;
  name: string;
  nickname: string;
  userType: UserType;
  email: string;
}
