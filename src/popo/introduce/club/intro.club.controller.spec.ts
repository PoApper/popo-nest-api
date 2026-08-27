import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { NestjsFormDataModule } from 'nestjs-form-data';

import configurations from 'src/config/configurations';
import { IntroClubController } from './intro.club.controller';
import { IntroClubService } from './intro.club.service';
import { IntroClub } from './intro.club.entity';
import { ClubType } from './intro.club.meta';
import { CreateIntroClubDto } from './intro.club.dto';
import { FileService } from '../../../file/file.service';

describe('IntroClubController (Integration)', () => {
  let controller: IntroClubController;
  let service: IntroClubService;
  let dataSource: DataSource;

  const longNotionUrl =
    'https://thin-pressure-60b.notion.site/Team-Postech-cbcb9c3690508204ba38012dda8cddaa?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAdGRleAT2eXBwZG9mAmZkaWQWUM-GRi9d1ehPHuTmUIcXFxZ_eYaTGWV4dG4DYWVtAjExAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABp5nrScTL3XDHSnLZsgfIwULAuejvPS9RaBjXP8ahjrdZpLE0gqMZk3m_7aMb_aem_u9wjljsiIMVykzxYlFzf7g';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configurations],
        }),
        NestjsFormDataModule.config({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            return dbConfig;
          },
        }),
        TypeOrmModule.forFeature([IntroClub]),
      ],
      controllers: [IntroClubController],
      providers: [
        IntroClubService,
        {
          provide: FileService,
          useValue: {
            uploadFile: jest
              .fn()
              .mockResolvedValue('https://example.com/uploaded.png'),
          },
        },
      ],
    }).compile();

    controller = module.get<IntroClubController>(IntroClubController);
    service = module.get<IntroClubService>(IntroClubService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    const repository = dataSource.getRepository(IntroClub);
    await repository.clear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create and retrieve a club with a long URL (> 255 chars)', async () => {
    expect(longNotionUrl.length).toBeGreaterThan(255);

    const createDto: CreateIntroClubDto = {
      name: 'PoApper',
      shortDesc: '개발 동아리',
      clubType: ClubType.study,
      content: '포스텍 개발 동아리 포애퍼입니다.',
      location: '학생회관 313호',
      representative: '홍길동',
      contact: 'popo@postech.ac.kr',
      homepageUrl: longNotionUrl,
      facebookUrl: `${longNotionUrl}&platform=facebook`,
      instagramUrl: `${longNotionUrl}&platform=instagram`,
      youtubeUrl: `${longNotionUrl}&platform=youtube`,
    };

    const savedClub = await controller.post(createDto);
    expect(savedClub).toBeDefined();
    expect(savedClub.uuid).toBeDefined();
    expect(savedClub.homepageUrl).toBe(longNotionUrl);
    expect(savedClub.facebookUrl).toBe(`${longNotionUrl}&platform=facebook`);
    expect(savedClub.instagramUrl).toBe(`${longNotionUrl}&platform=instagram`);
    expect(savedClub.youtubeUrl).toBe(`${longNotionUrl}&platform=youtube`);

    const fetchedClub = await controller.getOneByUuid(savedClub.uuid);
    expect(fetchedClub).toBeDefined();
    expect(fetchedClub.homepageUrl).toBe(longNotionUrl);
    expect(fetchedClub.facebookUrl).toBe(`${longNotionUrl}&platform=facebook`);
    expect(fetchedClub.instagramUrl).toBe(
      `${longNotionUrl}&platform=instagram`,
    );
    expect(fetchedClub.youtubeUrl).toBe(`${longNotionUrl}&platform=youtube`);
  });

  it('should update a club with a long homepage URL (> 255 chars)', async () => {
    const initialDto: CreateIntroClubDto = {
      name: 'Team Postech',
      shortDesc: '테스트 동아리',
      clubType: ClubType.sports,
      content: '소개글',
      location: '체육관',
      representative: '김철수',
      contact: 'test@postech.ac.kr',
      homepageUrl: 'https://short-url.com',
      facebookUrl: '',
      instagramUrl: '',
      youtubeUrl: '',
    };

    const created = await controller.post(initialDto);

    const updateDto: CreateIntroClubDto = {
      ...initialDto,
      homepageUrl: longNotionUrl,
    };

    await controller.put(created.uuid, updateDto);

    const updated = await controller.getOneByUuid(created.uuid);
    expect(updated.homepageUrl).toBe(longNotionUrl);
  });
});
