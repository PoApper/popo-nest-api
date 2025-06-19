import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UserStatus, UserType } from './user.meta';
import { SettingService } from '../setting/setting.service';
import { Nickname } from './nickname.entity';

const Message = {
  EXISTING_EMAIL: 'This email is already used.',
  NOT_EXISTING_USER: "There's no such user.",
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly settingService: SettingService,
    @InjectRepository(Nickname)
    private readonly nicknameRepo: Repository<Nickname>,
  ) {}

  async save(dto: CreateUserDto) {
    const existUser = await this.userRepo.findOneBy({ email: dto.email });

    if (existUser) {
      throw new BadRequestException(Message.EXISTING_EMAIL);
    }

    const cryptoSalt = crypto.randomBytes(64).toString('base64');
    const encryptedPassword = this.encryptPassword(dto.password, cryptoSalt);

    const isRcStudent = await this.settingService.checkRcStudent(dto.email);

    return this.userRepo.save({
      email: dto.email,
      password: encryptedPassword,
      cryptoSalt: cryptoSalt,
      name: dto.name,
      userType: isRcStudent ? UserType.rc_student : dto.userType,
      lastLoginAt: new Date(),
      userStatus: UserStatus.activated,
    });
  }

  find(findOptions: object) {
    return this.userRepo.find(findOptions);
  }

  searchByKeyword(keyword = '', take = 10, skip = 0) {
    const qb = this.userRepo.createQueryBuilder();

    return qb
      .select('*')
      .where(`LOWER(name) LIKE '%${keyword}%'`)
      .orWhere(`LOWER(email) LIKE '%${keyword}%'`)
      .orWhere(`LOWER(userType) LIKE '%${keyword}%'`)
      .orderBy('lastLoginAt', 'DESC')
      .skip(skip)
      .take(take)
      .getRawMany();
  }
  searchCountByKeyword(keyword = '') {
    const qb = this.userRepo.createQueryBuilder();

    return qb
      .select('COUNT(*) AS count')
      .where(`LOWER(name) LIKE '%${keyword}%'`)
      .orWhere(`LOWER(email) LIKE '%${keyword}%'`)
      .orWhere(`LOWER(userType) LIKE '%${keyword}%'`)
      .orderBy('lastLoginAt', 'DESC')
      .getRawOne();
  }

  count(whereOption?: object) {
    return this.userRepo.count({ where: whereOption });
  }

  findOneByUuid(uuid: string) {
    return this.userRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.userRepo.findOneByOrFail({ uuid: uuid });
  }

  findOneByEmail(email: string) {
    return this.userRepo.findOneBy({ email: email });
  }

  findOneByUuidWithInfo(uuid: string) {
    return this.userRepo.findOne({
      where: { uuid: uuid },
      select: [
        'uuid',
        'email',
        'name',
        'userType',
        'userStatus',
        'createdAt',
        'lastLoginAt',
      ],
    });
  }

  async update(uuid: string, updateUserDto: UpdateUserDto) {
    const existUser = await this.findOneByUuidOrFail(uuid);

    if (existUser.email != updateUserDto.email) {
      const existEmailUser = await this.findOneByEmail(updateUserDto.email);
      if (existEmailUser) {
        throw new BadRequestException(Message.EXISTING_EMAIL);
      }
    }

    return this.userRepo.update(
      { uuid: uuid, email: existUser.email },
      {
        uuid: uuid,
        email: updateUserDto.email,
        name: updateUserDto.name,
        userType: updateUserDto.userType,
        userStatus: updateUserDto.userStatus,
      },
    );
  }

  async updateLogin(uuid: string) {
    const existUser = await this.findOneByUuid(uuid);
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    } else {
      return this.userRepo.update(
        { uuid: existUser.uuid, email: existUser.email },
        {
          lastLoginAt: new Date(),
        },
      );
    }
  }

  async updatePasswordByUuid(uuid: string, password: string) {
    const existUser = await this.findOneByUuidOrFail(uuid);

    const cryptoSalt = crypto.randomBytes(64).toString('base64');
    const encryptedPassword = this.encryptPassword(password, cryptoSalt);

    return this.userRepo.update(
      { uuid: existUser.uuid, email: existUser.email },
      {
        password: encryptedPassword,
        cryptoSalt: cryptoSalt,
      },
    );
  }

  async updatePasswordByEmail(email: string, password: string) {
    const existUser = await this.findOneByEmail(email);

    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    const cryptoSalt = crypto.randomBytes(64).toString('base64');
    const encryptedPassword = this.encryptPassword(password, cryptoSalt);

    return this.userRepo.update(
      { uuid: existUser.uuid, email: existUser.email },
      {
        password: encryptedPassword,
        cryptoSalt: cryptoSalt,
      },
    );
  }

  async updateUserStatus(uuid: string, status: UserStatus) {
    const existUser = await this.findOneByUuidOrFail(uuid);

    return this.userRepo.update(
      { uuid: existUser.uuid, email: existUser.email },
      {
        userStatus: status,
      },
    );
  }

  async remove(uuid: string) {
    await this.findOneByUuidOrFail(uuid);

    return this.userRepo.delete({ uuid: uuid });
  }

  // password encrypt util
  private encryptPassword(password: string, cryptoSalt: string) {
    return crypto
      .pbkdf2Sync(password, cryptoSalt, 10000, 64, 'sha512')
      .toString('base64');
  }

  async getNickname(userUuid: string) {
    const nickname = await this.nicknameRepo.findOne({
      where: { userUuid },
    });

    return { nickname: nickname ? nickname.nickname : null };
  }

  async updateRefreshToken(
    userUuid: string,
    hashedToken: string | null,
    expiresAt: Date | null,
  ) {
    return this.userRepo.update(
      { uuid: userUuid },
      {
        hashedRefreshToken: hashedToken,
        refreshTokenExpiresAt: expiresAt,
      },
    );
  }
}
