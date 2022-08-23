import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from '../popo/user/user.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly userService: UserService) {}

  @Get('user')
  searchUser(@Query('q') query: string) {
    return this.userService.searchByKeyword(query);
  }
}
