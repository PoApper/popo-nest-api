import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/public-guard.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health Check' })
  sayHello() {
    return this.appService.getHello();
  }
}
