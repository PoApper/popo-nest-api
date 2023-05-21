import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordChangeRequestEntity } from './password-change-request.entity';
import { PasswordChangeRequestStatus } from './password-change-request.type';

@Injectable()
export class PasswordChangeService {
  constructor(
    @InjectRepository(PasswordChangeRequestEntity)
    private readonly passwordChangeRepo: Repository<PasswordChangeRequestEntity>,
  ) {}

  findPasswordChangeRequest(request_uuid: string) {
    return this.passwordChangeRepo.findOne(request_uuid);
  }

  createPasswordChangeRequest(user_uuid: string) {
    return this.passwordChangeRepo.save({
      user_uuid: user_uuid,
    });
  }

  async updatePasswordChangeRequestStatus(
    request_uuid: string,
    status: PasswordChangeRequestStatus,
  ) {
    await this.passwordChangeRepo.findOneOrFail(request_uuid);
    return this.passwordChangeRepo.update(
      { uuid: request_uuid },
      { status: status },
    );
  }

  delete(uuid: string) {
    return this.passwordChangeRepo.delete({ uuid: uuid });
  }
}
