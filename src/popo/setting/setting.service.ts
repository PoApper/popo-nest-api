import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User } from '../user/user.entity';
import { UserType } from '../user/user.meta';
import { FileService } from 'src/file/file.service';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly fileService: FileService,
  ) {}

  resetRcStudentsUserType() {
    return this.userRepo.update({userType: UserType.rc_student}, {userType: UserType.student});
  }

  async setRcStudentsUserTypeByCsv() {
    // Get email list from csv
    const queryRet = await this.fileService.queryOnS3('popo-rc-students-list.csv', 'SELECT * FROM S3Object s');

    let updatedUserCnt = 0;
    for(const row of queryRet) {
      const email = row['email'];
      if (!email) continue;

      const user = await this.userRepo.findOneBy({email: email});
      if (!user) continue;

      updatedUserCnt += 1;
      await this.userRepo.update({email: email}, {userType: UserType.rc_student});
    }

    return {
      'total_rc_user_count': queryRet.length,
      'updated_user_count': updatedUserCnt,
    }
  }
}
