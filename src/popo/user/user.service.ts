import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { encryptWord } from '../../utils/encrypt-utils';

const Message = {
  EXISTING_EMAIL: 'This email is already used.',
  EXISTING_ID: 'This id is already used.',
  NOT_EXISTING_USER: "There's no such user.",
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async save(dto: CreateUserDto) {
    const existUser = await this.userRepo.findOne({ email: dto.email });

    if (existUser) {
      throw new BadRequestException(Message.EXISTING_EMAIL);
    } else {
      const cryptoSalt = crypto.randomBytes(64).toString('base64');
      const encryptedPassword = encryptWord(dto.password, cryptoSalt);

      return this.userRepo.save({
        email: dto.email,
        id: dto.id,
        password: encryptedPassword,
        cryptoSalt: cryptoSalt,
        name: dto.name,
        userType: dto.userType,
        lastLoginAt: new Date(),
      });
    }
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
      .orWhere(`LOWER(id) LIKE '%${keyword}%'`)
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
      .orWhere(`LOWER(id) LIKE '%${keyword}%'`)
      .orderBy('lastLoginAt', 'DESC')
      .getRawOne();
  }

  count(findOptions?: object) {
    return this.userRepo.count(findOptions);
  }

  findOne(findOptions: object, maybeOption?: object) {
    return this.userRepo.findOne(findOptions, maybeOption);
  }

  findOneByUuidWithInfo(uuid: string) {
    return this.userRepo.findOne({
      where: { uuid: uuid },
      select: [
        'uuid',
        'id',
        'email',
        'name',
        'userType',
        'userStatus',
        'createdAt',
        'lastLoginAt',
      ],
    });
  }

  findOneOrFail(findOptions: object, maybeOption?: object) {
    const existUser = this.userRepo.findOne(findOptions, maybeOption);
    if (existUser) {
      return existUser;
    } else {
      throw new BadRequestException(Message.EXISTING_EMAIL);
    }
  }

  findOneByEmail(email: string) {
    return this.userRepo.findOne({ email: email });
  }

  findOneById(id: string) {
    return this.userRepo.findOne({ id: id });
  }

  findOneByUuid(uuid: string) {
    return this.userRepo.findOne({ uuid: uuid });
  }

  async update(uuid: string, updateUserDto: UpdateUserDto) {
    const existUser = await this.findOne({ uuid: uuid });
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    if (existUser.email != updateUserDto.email) {
      const existEmailUser = await this.findOneByEmail(updateUserDto.email);
      if (existEmailUser) {
        throw new BadRequestException(Message.EXISTING_EMAIL);
      }
    }

    if (existUser.id != updateUserDto.id) {
      const existIdUser = await this.findOneById(updateUserDto.id);
      if (existIdUser) {
        throw new BadRequestException(Message.EXISTING_EMAIL);
      }
    }

    return this.userRepo.update(
      { uuid: uuid, email: existUser.email, id: existUser.id },
      {
        uuid: uuid,
        email: updateUserDto.email,
        id: updateUserDto.id,
        name: updateUserDto.name,
        userType: updateUserDto.userType,
        userStatus: updateUserDto.userStatus,
      },
    );
  }

  async updatePasswordChangeRequestEventById(id: string) {
    const targetUser = await this.findOneById(id);
    if (!targetUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.userRepo.update(
      { uuid: targetUser.uuid, email: targetUser.email, id: targetUser.id },
      { last_password_change_request_at: new Date() },
    );
  }

  async updateLoginById(id: string) {
    const existUser = await this.findOneById(id);
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.userRepo.update(
      { uuid: existUser.uuid, email: existUser.email, id: existUser.id },
      {
        lastLoginAt: new Date(),
      },
    );
  }

  async updatePasswordByUuid(uuid: string, password: string) {
    const existUser = await this.findOneByUuid(uuid);

    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    const cryptoSalt = crypto.randomBytes(64).toString('base64');
    const encryptedPassword = encryptWord(password, cryptoSalt);

    return this.userRepo.update(
      { uuid: existUser.uuid, email: existUser.email, id: existUser.id },
      {
        password: encryptedPassword,
        cryptoSalt: cryptoSalt,
      },
    );
  }

  async updatePWByID(id: string, password: string) {
    const existUser = await this.findOneById(id);

    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    const cryptoSalt = crypto.randomBytes(64).toString('base64');
    const encryptedPassword = encryptWord(password, cryptoSalt);

    return this.userRepo.update(
      { uuid: existUser.uuid, email: existUser.email, id: existUser.id },
      {
        password: encryptedPassword,
        cryptoSalt: cryptoSalt,
      },
    );
  }

  async updateUserStatus(uuid: string, status) {
    const existUser = await this.findOne({ uuid: uuid });
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }
    return this.userRepo.update(
      { uuid: existUser.uuid, email: existUser.email, id: existUser.id },
      {
        userStatus: status,
      },
    );
  }

  async remove(uuid: string) {
    const existUser = await this.findOne({ uuid: uuid });

    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.userRepo.delete({ uuid: uuid });
  }
}
