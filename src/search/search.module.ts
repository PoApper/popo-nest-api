import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { UserModule } from '../popo/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [SearchController],
})
export class SearchModule {}
