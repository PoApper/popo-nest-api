import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../popo/user/user.meta';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
