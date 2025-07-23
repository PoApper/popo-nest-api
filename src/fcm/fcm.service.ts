import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { getMessaging } from 'firebase-admin/messaging';

import { FcmKey } from './entities/fcm-key.entity';

@Injectable()
export class FcmService {
  constructor(
    @InjectRepository(FcmKey)
    private readonly pushKeyRepository: Repository<FcmKey>,
  ) {}
  findByUserUuids(userUuids: string | string[]) {
    return this.pushKeyRepository.find({
      where: {
        userUuid: In(Array.isArray(userUuids) ? userUuids : [userUuids]),
      },
    });
  }

  findByPushKey(pushKey: string) {
    return this.pushKeyRepository.findOne({
      where: { pushKey },
    });
  }

  findOne(userUuid: string, pushKey: string) {
    return this.pushKeyRepository.findOne({
      where: { userUuid, pushKey },
    });
  }

  async sendPushNotificationByUserUuid(
    userUuids: string | string[],
    title: string,
    body: string,
    data?: any,
  ) {
    const tokens = await this.findByUserUuids(userUuids);
    return await this.sendPushNotificationByToken(
      tokens.map((token) => token.pushKey),
      title,
      body,
      data,
    );
  }

  async sendPushNotificationByToken(
    tokens: string | string[],
    title: string,
    body: string,
    data?: any,
  ) {
    return getMessaging()
      .sendEachForMulticast({
        tokens: Array.isArray(tokens) ? tokens : [tokens],
        notification: {
          title: title,
          body: body,
        },
        data: data,
        // iOS
        apns: {
          payload: {
            aps: {
              // 프론트 포그라운드 처리를 위한 설정
              alert: {
                title: title,
                body: body,
              },
              sound: 'default',
              contentAvailable: true, // 백그라운드 푸시 알림을 위한 설정
            },
          },
        },
      })
      .then((response) => {
        return response;
      });
  }
}
