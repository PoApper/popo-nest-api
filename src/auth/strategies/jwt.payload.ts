import { UserType } from '../../popo/user/user.meta';

export class JwtPayload {
  uuid: string;
  id: string;
  name: string;
  userType: UserType;
  email: string;
}
