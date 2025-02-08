import { Test, TestingModule } from '@nestjs/testing';
import { WhitebookController } from './whitebook.controller';
import { WhitebookService } from './whitebook.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { WhitebookDto } from './whitebook.dto';
import { FileService } from 'src/file/file.service';
import { MemoryStoredFile } from 'nestjs-form-data';
import { NestjsFormDataModule } from 'nestjs-form-data';
import * as moment from 'moment';
import { Whitebook } from './whitebook.entity';
import { UpdateResult } from 'typeorm';

describe('WhitebookController', () => {
  let controller: WhitebookController;
  let whitebookService: DeepMocked<WhitebookService>;
  let fileService: DeepMocked<FileService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NestjsFormDataModule],
      controllers: [WhitebookController],
      providers: [
        {
          provide: WhitebookService,
          useValue: createMock<WhitebookService>(),
        },
        {
          provide: FileService,
          useValue: createMock<FileService>(),
        },
      ],
    }).compile();

    controller = module.get<WhitebookController>(WhitebookController);
    whitebookService = module.get(WhitebookService);
    fileService = module.get(FileService);
  });

  const createWhitebookEntityFromDto = (
    dto: WhitebookDto,
    link: string,
  ): Whitebook => {
    const entity = new Whitebook();
    entity.uuid = 'uuid';
    entity.title = dto.title;
    entity.content = dto.content;
    entity.link = link;
    entity.show_only_login = dto.show_only_login;
    entity.click_count = 0;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    return entity;
  };

  const createUpdateResultFromDto = (
    dto: Partial<WhitebookDto>,
    uuid: string,
  ): UpdateResult => ({
    raw: [],
    affected: 1,
    generatedMaps: [{ ...dto, uuid }],
  });

  const generatePdfUrl = (title: string): string =>
    `whitebook/${title}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`;

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(whitebookService).toBeDefined();
    expect(fileService).toBeDefined();
  });

  it('should create whitebook with link', async () => {
    const dto: WhitebookDto = {
      title: 'title',
      content: 'content',
      link: 'link',
      show_only_login: false,
    };

    const WhitebookEntity = createWhitebookEntityFromDto(dto, dto.link!);

    whitebookService.save.mockResolvedValue(WhitebookEntity);

    const savedWhitebook = await controller.create(dto);

    expect(savedWhitebook).toEqual(WhitebookEntity);
    expect(whitebookService.save).toHaveBeenCalledWith(dto);
  });

  it('should create whitebook with pdf file', async () => {
    const pdfFile = new MemoryStoredFile();
    const dto: WhitebookDto = {
      title: 'title',
      content: 'content',
      pdf_file: pdfFile,
      show_only_login: false,
    };

    const pdfUrl = generatePdfUrl(dto.title);

    fileService.uploadFile.mockResolvedValue(pdfUrl);

    const WhitebookEntity = createWhitebookEntityFromDto(dto, pdfUrl);

    whitebookService.save.mockResolvedValue(WhitebookEntity);

    const savedWhitebook = await controller.create(dto);

    expect(savedWhitebook).toEqual(WhitebookEntity);
    expect(whitebookService.save).toHaveBeenCalledWith({
      title: dto.title,
      content: dto.content,
      show_only_login: dto.show_only_login,
      link: pdfUrl,
    });
  });

  it('should update whitebook with link', async () => {
    const uuid = 'uuid';
    const dto: WhitebookDto = {
      title: 'updated title',
      content: 'updated content',
      link: 'updated link',
      show_only_login: false,
    };

    const updatedResult = createUpdateResultFromDto(dto, uuid);

    whitebookService.update.mockResolvedValue(updatedResult);

    const updatedWhitebook = await controller.update(uuid, dto);

    expect(updatedWhitebook).toEqual(updatedResult);
    expect(whitebookService.update).toHaveBeenCalledWith(uuid, dto);
  });

  it('should update whitebook with pdf file', async () => {
    const uuid = 'uuid';
    const pdfFile = new MemoryStoredFile();
    const dto: WhitebookDto = {
      title: 'updated title',
      content: 'updated content',
      pdf_file: pdfFile,
      show_only_login: false,
    };

    const pdfUrl = generatePdfUrl(dto.title);

    fileService.uploadFile.mockResolvedValue(pdfUrl);

    const updatedResult = createUpdateResultFromDto(
      {
        title: dto.title,
        content: dto.content,
        link: pdfUrl,
        show_only_login: dto.show_only_login,
      },
      uuid,
    );

    whitebookService.update.mockResolvedValue(updatedResult);

    const updatedWhitebook = await controller.update(uuid, dto);

    expect(updatedWhitebook).toEqual(updatedResult);
    expect(whitebookService.update).toHaveBeenCalledWith(uuid, {
      title: dto.title,
      content: dto.content,
      show_only_login: dto.show_only_login,
      link: pdfUrl,
    });
  });
});
