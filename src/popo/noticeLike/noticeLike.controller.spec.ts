import { Test, TestingModule } from '@nestjs/testing';
import { NoticeLikeController } from './noticeLike.controller';
import { NoticeLikeService } from './noticeLike.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NoticeLike } from './noticeLike.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';

describe('NoticeLikeController', () => {
  let controller: NoticeLikeController;
  let noticeLikeService: DeepMocked<NoticeLikeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticeLikeController],
      providers: [
        {
          provide: NoticeLikeService,
          useValue: createMock<NoticeLikeService>(),
        },
      ],
    }).compile();

    controller = module.get<NoticeLikeController>(NoticeLikeController);
    noticeLikeService = module.get(NoticeLikeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(noticeLikeService).toBeDefined();
  });

  it('should count likes', async () => {
    const result = 1;
    const noticeId = 1;
    noticeLikeService.countLikes.mockResolvedValue(result);

    expect(await controller.countLikes(noticeId)).toBe(result);
  });

  // TODO: noticeLike.service.spec.ts로 테스트 옮기기
  // 테스트 DB를 만들어 실제로 데이터를 DB에 넣고 findByUserIdAndNoticeId를 테스트하기
  // it('should get status', async () => {
  //   const result = true;
  //   const like: Promise<NoticeLike> = {
  //     id: 1,
  //     user_id: '1',
  //     notice_id: '1',
  //     createdAt: new Date(),
  //   };
  //   const userId = '1';
  //   const noticeId = '1';
  //   noticeLikeService.findByUserIdAndNoticeId.mockResolvedValue(like);

  //   await expect(controller.getStatus(userId, noticeId)).toBe(result);
  // });

  it('should throw error when delete if it is not liked', async () => {
    const userId = '1';
    const noticeId = 1;
    noticeLikeService.findByUserIdAndNoticeId.mockResolvedValue(null);

    const user = { uuid: '1' } as JwtPayload;

    await expect(
      controller.delete(userId, noticeId, { user: user }),
    ).rejects.toThrow();
  });

  it('should delete like', async () => {
    const userId = '1';
    const noticeId = 1;
    const like: NoticeLike = {
      id: 1,
      user_id: '1',
      notice_id: 1,
      createdAt: new Date(),
    };

    const user = { uuid: '1' } as JwtPayload;

    const mockedDeletedResult = { affected: 1, raw: null };
    noticeLikeService.findByUserIdAndNoticeId.mockResolvedValue(like);
    noticeLikeService.delete.mockResolvedValue(mockedDeletedResult);

    expect(await controller.delete(userId, noticeId, { user: user })).toBe(
      mockedDeletedResult,
    );
  });
});
