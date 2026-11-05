import { BadRequestException } from '@nestjs/common';

export function normalizeEnglishName(
  name: string | null | undefined,
): string | null | undefined {
  if (name === undefined || name === null) return name;
  if (typeof name !== 'string' || name.trim().length > 255) {
    throw new BadRequestException(
      'English name must be a string of at most 255 characters.',
    );
  }
  return name.trim() || null;
}
