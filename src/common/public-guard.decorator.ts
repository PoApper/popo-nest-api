import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// 현재는 JwtAuthGuard를 우회하기 위해서만 사용됨
// 두 개 이상의 Guard를 사용하고, 우회할 일이 있다면 Paxi의 public-guard.decorator.ts 참고
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
