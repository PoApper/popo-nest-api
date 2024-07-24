import { Test, TestingModule } from '@nestjs/testing';
import { NoticeLikeController } from './noticeLike.controller';
import { NoticeLikeService } from './noticeLike.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NoticeLike } from './noticeLike.entity';

describe('NoticeLikeController', () => {
  let controller: NoticeLikeController;
  let likeService: DeepMocked<NoticeLikeService>;

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
    likeService = module.get(NoticeLikeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(likeService).toBeDefined();
  });

  it('should count likes', async () => {
    const result = 1;
    const noticeId = '1';
    likeService.countLikes.mockResolvedValue(result);

    expect(await controller.countLikes(noticeId)).toBe(result);
  });

  it('should get status', async () => {
    const result = true;
    const like: NoticeLike = {
      id: 1,
      user_id: '1',
      notice_id: '1',
      created_at: new Date(),
    };
    const userId = '1';
    const noticeId = '1';
    likeService.findByUserIdAndNoticeId.mockResolvedValue(like);

    await expect(controller.getStatus(userId, noticeId)).toBe(result);
  });

  it('should throw error when delete if it is not liked', async () => {
    const userId = '1';
    const noticeId = '1';
    likeService.findByUserIdAndNoticeId.mockResolvedValue(null);

    await expect(controller.delete(userId, noticeId)).rejects.toThrow();
  });

  it('should delete like', async () => {
    const userId = '1';
    const noticeId = '1';
    const like: NoticeLike = {
      id: 1,
      user_id: '1',
      notice_id: '1',
      created_at: new Date(),
    };
    const mockedDeletedResult = { affected: 1, raw: null };
    likeService.findByUserIdAndNoticeId.mockResolvedValue(like);
    likeService.delete.mockResolvedValue(mockedDeletedResult);

    expect(await controller.delete(userId, noticeId)).toBe(mockedDeletedResult);
  });
});
