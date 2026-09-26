import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  period: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  target: string;
  @IsString()
  @IsNotEmpty()
  applicationMethod: string;
  @IsString()
  @IsNotEmpty()
  description: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category: string;
  @IsOptional()
  @IsString()
  @MaxLength(255)
  iconName?: string;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
