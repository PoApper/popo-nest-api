import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Place } from './place/place.entity';
import { PlaceService } from './place/place.service';
import { PlaceDto } from './place/place.dto';
import { PlaceEnableAutoAccept, PlaceRegion } from './place/place.meta';
import { Equip } from './equip/equip.entity';
import { EquipService } from './equip/equip.service';
import { EquipmentDto } from './equip/equip.dto';
import { EquipOwner } from './equip/equip.meta';

describe.each(['place', 'equip'] as const)('%s English names', (kind) => {
  let dataSource: DataSource;
  let service: PlaceService | EquipService;
  const dto = {
    name: '원래 이름',
    description: 'Resource description',
    location: '학생회관',
    region: PlaceRegion.student_hall,
    fee: 0,
    equipOwner: EquipOwner.dongyeon,
    staffEmail: '',
    maxMinutes: 1440,
    maxConcurrentReservation: 1,
    openingHours: '{"Everyday":"00:00-24:00"}',
    enableAutoAccept: PlaceEnableAutoAccept.inactive,
  };

  function update(uuid: string, changes: Partial<PlaceDto & EquipmentDto>) {
    return service.update(uuid, changes as PlaceDto & EquipmentDto);
  }

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ['src/**/*.entity.ts'],
      synchronize: true,
    });
    await dataSource.initialize();
    service =
      kind === 'place'
        ? new PlaceService(dataSource.getRepository(Place))
        : new EquipService(dataSource.getRepository(Equip));
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  it('persists the English name while preserving canonical name lookup', async () => {
    const resource = await service.save({ ...dto, nameEn: '  English name  ' });
    expect(resource.nameEn).toBe('English name');
    expect(await service.findOneByName(dto.name)).toMatchObject({
      uuid: resource.uuid,
      name: dto.name,
      nameEn: 'English name',
    });
  });

  it('supports resources created without an English name', async () => {
    const resource = await service.save(dto);
    expect(await service.findOneByUuid(resource.uuid)).toMatchObject({
      name: dto.name,
      nameEn: null,
    });
  });

  it('keeps an existing English name when an older client omits the field', async () => {
    const resource = await service.save({ ...dto, nameEn: 'Original English' });
    await update(resource.uuid, { description: 'Updated' });
    expect(await service.findOneByUuid(resource.uuid)).toMatchObject({
      description: 'Updated',
      nameEn: 'Original English',
    });
  });

  it('updates the English name without changing the canonical name or UUID', async () => {
    const resource = await service.save(dto);
    await update(resource.uuid, { nameEn: '  New English  ' });
    expect(await service.findOneByName(dto.name)).toMatchObject({
      uuid: resource.uuid,
      name: dto.name,
      nameEn: 'New English',
    });
  });

  it.each([null, '', '   '])(
    'clears the English name with %p',
    async (nameEn) => {
      const resource = await service.save({ ...dto, nameEn: 'English name' });
      await update(resource.uuid, { nameEn });
      expect((await service.findOneByUuid(resource.uuid)).nameEn).toBeNull();
    },
  );

  it.each([42, ['English'], { name: 'English' }, 'x'.repeat(256)])(
    'rejects an invalid English name: %p',
    async (invalid) => {
      const nameEn = invalid as unknown as string;
      await expect(
        (async () => service.save({ ...dto, nameEn }))(),
      ).rejects.toBeInstanceOf(BadRequestException);
      const resource = await service.save({ ...dto, nameEn: 'Original' });
      await expect(update(resource.uuid, { nameEn })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect((await service.findOneByUuid(resource.uuid)).nameEn).toBe(
        'Original',
      );
    },
  );
});
