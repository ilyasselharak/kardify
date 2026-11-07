import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DesignSettingsDto } from '../../card-design/design.dto.js';

export const SOCIAL_PLATFORMS = [
  'linkedin', 'instagram', 'facebook', 'x', 'tiktok', 'youtube', 'github', 'custom',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Empty strings from forms become null so fields can be cleared. */
const emptyToNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};
const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true };
const PHONE = /^\+?[0-9\s().-]{5,25}$/;
const isSet = (_: object, v: unknown) => v !== null && v !== undefined;

export class SocialLinkDto {
  @ApiProperty({ enum: SOCIAL_PLATFORMS }) @IsIn(SOCIAL_PLATFORMS) platform: SocialPlatform;
  @ApiProperty() @IsUrl({ protocols: ['https', 'http'], require_protocol: true }) @MaxLength(500) url: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() visible?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) label?: string;
}

export class CreateCardDto {
  @ApiProperty() @Transform(emptyToNull) @IsString() @Length(1, 120) name: string;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(120) jobTitle?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(120) companyName?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(600) description?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(1000) profileImage?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(1000) companyLogo?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsEmail() @MaxLength(254) email?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @Matches(PHONE, { message: 'PHONE_INVALID' }) phone?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @Matches(PHONE, { message: 'PHONE_INVALID' }) whatsapp?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) website?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(300) address?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(1000) mapsUrl?: string | null;

  @ApiPropertyOptional({ type: [SocialLinkDto] })
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @ApiPropertyOptional({ type: DesignSettingsDto })
  @IsOptional() @ValidateNested() @Type(() => DesignSettingsDto)
  designSettings?: DesignSettingsDto;

  @ApiPropertyOptional({ enum: ['en', 'ar'] }) @IsOptional() @IsIn(['en', 'ar']) language?: 'en' | 'ar';
}

export class UpdateCardDto extends PartialType(CreateCardDto) {}

export class ListCardsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) search?: string;
  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE', 'INACTIVE'] }) @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE']) status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  @ApiPropertyOptional({ enum: ['newest', 'oldest'] }) @IsOptional() @IsIn(['newest', 'oldest']) sort?: 'newest' | 'oldest';
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class QrSettingsDto {
  @ApiPropertyOptional() @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/) fgColor?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/) bgColor?: string;
  @ApiPropertyOptional({ enum: ['none', 'kardify', 'company'] }) @IsOptional() @IsIn(['none', 'kardify', 'company']) logo?: 'none' | 'kardify' | 'company';
}

export class QrQueryDto extends QrSettingsDto {
  @ApiPropertyOptional({ enum: ['png', 'svg'] }) @IsOptional() @IsIn(['png', 'svg']) format?: 'png' | 'svg';
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(128) @Max(2048) size?: number;
  @ApiPropertyOptional() @IsOptional() @IsIn(['1', 'true']) download?: string;
  /** Cache-buster only; ignored by the server. */
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) v?: string;
}
