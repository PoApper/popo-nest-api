import { BadRequestException } from '@nestjs/common';

export function normalizeTranslations(
  dto: object,
  fields: readonly string[],
  textFields: readonly string[] = [],
): Record<string, string | null | undefined> {
  return Object.fromEntries(
    fields.map((field): [string, string | null | undefined] => {
      const value: unknown = Reflect.get(dto, field);
      if (value === undefined) return [field, undefined];
      if (value === null) return [field, null];
      if (typeof value !== 'string') {
        throw new BadRequestException(`${field} must be a string or null.`);
      }

      const text = value.trim();
      const tooLong = textFields.includes(field)
        ? Buffer.byteLength(text, 'utf8') > 65_535
        : text.length > 255;
      if (tooLong) {
        throw new BadRequestException(
          `${field} exceeds the allowed translation length.`,
        );
      }
      return [field, text || null];
    }),
  );
}
