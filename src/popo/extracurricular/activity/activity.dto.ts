import { IsNotEmpty, ValidateIf, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly period: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly target: string;

  @IsString()
  @IsNotEmpty()
  readonly applicationMethod: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly category: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(255)
  readonly iconName?: string;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto, {
  skipNullProperties: false,
}) {}
