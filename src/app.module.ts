import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PopoModule } from './popo/popo.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { StatisticsModule } from './statistics/statistics.module';
import { AdminModule } from './admin/admin.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ConfigModule.forRoot(),
    PopoModule,
    StatisticsModule,
    AuthModule,
    AdminModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
