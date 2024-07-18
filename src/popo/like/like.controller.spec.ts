import { Test, TestingModule } from '@nestjs/testing';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Like } from './like.entity';

describe('LikeController', () => {
  let controller: LikeController;
  let likeService: DeepMocked<LikeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikeController],
      providers: [
        {
          provide: LikeService,
          useValue: createMock<LikeService>(),
        },
      ],
    }).compile();

    controller = module.get<LikeController>(LikeController);
    likeService = module.get(LikeService);
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
    const like: Like = {
      id: 1,
      user_id: '1',
      notice_id: '1',
      createdAt: new Date(),
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
    const like: Like = {
      id: 1,
      user_id: '1',
      notice_id: '1',
      createdAt: new Date(),
    };
    const mockedDeletedResult = { affected: 1, raw: null };
    likeService.findByUserIdAndNoticeId.mockResolvedValue(like);
    likeService.delete.mockResolvedValue(mockedDeletedResult);

    expect(await controller.delete(userId, noticeId)).toBe(mockedDeletedResult);
  });
});
