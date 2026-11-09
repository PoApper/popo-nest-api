import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Place } from './place/place.entity';
import { PlaceDto } from './place/place.dto';
import { PlaceService } from './place/place.service';
import { PlaceEnableAutoAccept, PlaceRegion } from './place/place.meta';
import { Equip } from './equip/equip.entity';
import { EquipmentDto } from './equip/equip.dto';
import { EquipService } from './equip/equip.service';
import { EquipOwner } from './equip/equip.meta';
import { IntroAssociation } from './introduce/association/intro.association.entity';
import { CreateIntroAssociationDto } from './introduce/association/intro.association.dto';
import { IntroAssociationService } from './introduce/association/intro.association.service';
import { AssociationType } from './introduce/association/intro.association.meta';
import { IntroClub } from './introduce/club/intro.club.entity';
import { CreateIntroClubDto } from './introduce/club/intro.club.dto';
import { IntroClubService } from './introduce/club/intro.club.service';
import { ClubType } from './introduce/club/intro.club.meta';
import { IntroStudentAssociation } from './introduce/student_association/intro.student_association.entity';
import { CreateIntroStudentAssociationDto } from './introduce/student_association/intro.student_association.dto';
import { IntroStudentAssociationService } from './introduce/student_association/intro.student_association.service';

type UpdateDto = PlaceDto &
  EquipmentDto &
  CreateIntroAssociationDto &
  CreateIntroClubDto &
  CreateIntroStudentAssociationDto;

function createService(kind: string, source: DataSource) {
  switch (kind) {
    case 'place':
      return new PlaceService(source.getRepository(Place));
    case 'equip':
      return new EquipService(source.getRepository(Equip));
    case 'association':
      return new IntroAssociationService(
        source.getRepository(IntroAssociation),
      );
    case 'club':
      return new IntroClubService(source.getRepository(IntroClub));
    default:
      return new IntroStudentAssociationService(
        source.getRepository(IntroStudentAssociation),
      );
  }
}

describe.each([
  {
    kind: 'place',
    fields: ['locationEn', 'descriptionEn'],
    text: 'descriptionEn',
  },
  { kind: 'equip', fields: ['descriptionEn'], text: 'descriptionEn' },
  {
    kind: 'association',
    fields: [
      'nameEn',
      'contentEn',
      'locationEn',
      'representativeEn',
      'contactEn',
    ],
    text: 'contentEn',
  },
  {
    kind: 'club',
    fields: [
      'nameEn',
      'shortDescEn',
      'contentEn',
      'locationEn',
      'representativeEn',
      'contactEn',
    ],
    text: 'contentEn',
  },
  {
    kind: 'student_association',
    fields: [
      'nameEn',
      'shortDescEn',
      'contentEn',
      'locationEn',
      'representativeEn',
      'officeEn',
      'contactEn',
    ],
    text: 'contentEn',
  },
])('$kind bilingual content', ({ kind, fields, text }) => {
  let source: DataSource;
  let service: ReturnType<typeof createService>;
  const original = {
    name: '기존 이름',
    location: '기존 위치',
    description: '기존 설명',
    content: '기존 소개글',
    shortDesc: '기존 요약',
    representative: '기존 대표자',
    contact: '기존 연락처',
    office: '기존 행정팀',
    region: PlaceRegion.student_hall,
    equipOwner: EquipOwner.dongyeon,
    fee: 0,
    staffEmail: '',
    maxMinutes: 1440,
    maxConcurrentReservation: 1,
    enableAutoAccept: PlaceEnableAutoAccept.inactive,
    openingHours: '{"Everyday":"00:00-24:00"}',
    associationType: AssociationType.executive,
    clubType: ClubType.performance1,
    imageUrl: '',
    homepageUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
  };

  beforeAll(async () => {
    source = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ['src/**/*.entity.ts'],
      synchronize: true,
    });
    await source.initialize();
    service = createService(kind, source);
  });
  beforeEach(() => source.synchronize(true));
  afterAll(async () => {
    await source?.destroy();
  });

  const update = (uuid: string, values: Record<string, unknown>) =>
    service.update(uuid, values as unknown as UpdateDto);

  it('supports old create payloads without translations', async () => {
    const created = await service.save(original);
    const stored = await service.findOneByUuid(created.uuid);
    for (const field of fields) expect(stored[field]).toBeNull();
    expect(stored.name).toBe(original.name);
  });

  it.each(fields)(
    'round-trips %s, preserves omitted values, and supports clearing',
    async (field) => {
      const created = await service.save({
        ...original,
        [field]: '  English value  ',
      });
      let stored = await service.findOneByUuid(created.uuid);
      expect(stored[field]).toBe('English value');
      expect((await service.findOneByName(original.name)).uuid).toBe(
        created.uuid,
      );
      await update(created.uuid, { name: original.name });
      expect((await service.findOneByUuid(created.uuid))[field]).toBe(
        'English value',
      );
      await update(created.uuid, { [field]: '  Replacement  ' });
      expect((await service.findOneByUuid(created.uuid))[field]).toBe(
        'Replacement',
      );
      for (const empty of ['', '   ', null]) {
        await update(created.uuid, { [field]: 'Filled' });
        await update(created.uuid, { [field]: empty });
        stored = await service.findOneByUuid(created.uuid);
        expect(stored[field]).toBeNull();
        expect(stored.name).toBe(original.name);
      }
    },
  );

  it.each(fields)(
    'rejects malformed %s on both create and update',
    async (field) => {
      await expect(
        (async () => await service.save({ ...original, [field]: 42 }))(),
      ).rejects.toBeInstanceOf(BadRequestException);
      const created = await service.save({ ...original, [field]: 'Keep me' });
      for (const invalid of [42, ['not a string'], { nested: 'value' }]) {
        await expect(
          update(created.uuid, { [field]: invalid }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect((await service.findOneByUuid(created.uuid))[field]).toBe(
          'Keep me',
        );
      }
    },
  );

  it('checks the UTF-8 text limit while retaining paragraph breaks', async () => {
    const created = await service.save({
      ...original,
      [text]: '  First paragraph\nSecond paragraph  ',
    });
    expect((await service.findOneByUuid(created.uuid))[text]).toBe(
      'First paragraph\nSecond paragraph',
    );
    await update(created.uuid, { [text]: '가'.repeat(21_845) });
    await expect(
      update(created.uuid, { [text]: '가'.repeat(21_846) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  if (fields.some((field) => field !== text)) {
    it('accepts 255-character labels and rejects longer labels', async () => {
      const field = fields.find((field) => field !== text);
      const created = await service.save({
        ...original,
        [field]: 'x'.repeat(255),
      });
      expect((await service.findOneByUuid(created.uuid))[field]).toHaveLength(
        255,
      );
      await expect(
        update(created.uuid, { [field]: 'x'.repeat(256) }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  }
});
