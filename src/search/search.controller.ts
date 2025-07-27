import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from '../popo/user/user.service';
import { Roles } from '../auth/authroization/roles.decorator';
import { UserType } from '../popo/user/user.meta';
import { RolesGuard } from '../auth/authroization/roles.guard';

@ApiCookieAuth()
@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly userService: UserService) {}

  @Get('user')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async searchUser(
    @Query('q') query = '',
    @Query('take') take = 10,
    @Query('skip') skip = 0,
  ) {
    const users = await this.userService.searchByKeyword(
      query.toLowerCase(),
      take,
      skip,
    );
    const count = await this.userService.searchCountByKeyword(
      query.toLowerCase(),
    );
    const searchResult = {};

    searchResult['users'] = users;
    searchResult['count'] = count['count'];

    return searchResult;
  }
}
