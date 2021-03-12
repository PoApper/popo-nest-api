import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {PopoModule} from "./popo/popo.module";
import {AuthModule} from "./auth/auth.module";
import {ConfigModule} from "@nestjs/config";
import {StatisticsModule} from "./statistics/statistics.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ConfigModule.forRoot(),
    PopoModule,
    StatisticsModule,
    AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
