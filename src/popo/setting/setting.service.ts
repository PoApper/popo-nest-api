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
    return this.userRepo.update(
      { userType: UserType.rc_student },
      { userType: UserType.student },
    );
  }

  async countRcStduentsList() {
    const ret = await this.fileService.queryOnS3(
      'popo-rc-students-list.csv',
      'SELECT COUNT(*) AS cnt FROM S3Object s',
    );
    return ret[0]['cnt'];
  }

  async getRcStduentsStatus() {
    const rc_list = await this.fileService.queryOnS3(
      'popo-rc-students-list.csv',
      "SELECT name, TRIM(TRAILING '\r' FROM email) AS email FROM S3Object s",
    );

    for (const row of rc_list) {
      const email = row['email'];
      const user = await this.userRepo.findOneBy({ email: email });
      if (user) {
        row['status'] = 'registered';
        row['user_name'] = user['name'];
        row['user_type'] = user['userType'];
        row['created_at'] = user['createdAt'];
      } else {
        row['status'] = 'not_registered';
      }
    }

    return rc_list;
  }

  async checkRcStudent(email: string) {
    const ret = await this.fileService.queryOnS3(
      'popo-rc-students-list.csv',
      `SELECT email FROM S3Object s WHERE TRIM(TRAILING '\r' FROM s.email) = '${email}'`,
    );
    return ret.length > 0;
  }

  async setRcStudentsUserTypeByCsv() {
    // Get email list from csv
    const queryRet = await this.fileService.queryOnS3(
      'popo-rc-students-list.csv',
      "SELECT TRIM(TRAILING '\r' FROM email) AS email FROM S3Object s",
    );

    let updatedUserCnt = 0;
    for (const row of queryRet) {
      const email = row['email'];
      if (!email) continue;

      const user = await this.userRepo.findOneBy({ email: email });
      if (!user) continue;

      updatedUserCnt += 1;
      await this.userRepo.update(
        { email: email },
        { userType: UserType.rc_student },
      );
    }

    return {
      total_rc_user_count: queryRet.length,
      updated_user_count: updatedUserCnt,
    };
  }
}
