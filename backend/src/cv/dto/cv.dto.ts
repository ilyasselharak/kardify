import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsHexColor,
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
import {
  CV_DATE_FORMATS,
  CV_FONT_SCALES,
  CV_FONTS,
  CV_MARGINS,
  CV_SECTION_KEYS,
  CV_SKILL_STYLES,
  CV_SPACINGS,
  CV_TEMPLATE_IDS,
  EMPLOYMENT_TYPES,
  EXTRA_KINDS,
  LANGUAGE_LEVELS,
  MONTH_RE,
  SKILL_CATEGORIES,
  type CvSectionKey,
  type CvTemplateId,
} from '../cv.constants.js';

/** Trims strings; empty strings become null so optional fields can be cleared. */
const emptyToNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};
/** Trims strings but keeps "" (for non-null text columns). */
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const isSet = (_: object, v: unknown) => v !== null && v !== undefined;
const URL_OPTS = { protocols: ['http', 'https'], require_protocol: true };
const PHONE = /^\+?[0-9\s().-]{5,25}$/;

// ─── Profile ───────────────────────────────────────────────────────────

export class UpdateCvProfileDto {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(120) professionalTitle?: string;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(1000) photo?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsEmail() @MaxLength(254) email?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @Matches(PHONE, { message: 'PHONE_INVALID' }) phone?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(200) address?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(100) city?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(100) country?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) website?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) linkedin?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) github?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) portfolio?: string | null;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) summary?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) objectives?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) achievements?: string;
}

// ─── Design ────────────────────────────────────────────────────────────

/** Every field optional; the frontend fills gaps from the template defaults. */
export class CvDesignDto {
  @IsOptional() @IsHexColor() accentColor?: string;
  @IsOptional() @IsHexColor() textColor?: string;
  @IsOptional() @IsIn(CV_FONTS) fontFamily?: (typeof CV_FONTS)[number];
  @IsOptional() @IsIn(CV_FONTS) headingFont?: (typeof CV_FONTS)[number];
  @IsOptional() @IsIn(CV_FONT_SCALES) fontScale?: (typeof CV_FONT_SCALES)[number];
  @IsOptional() @IsIn(CV_SPACINGS) spacing?: (typeof CV_SPACINGS)[number];
  @IsOptional() @IsIn(CV_MARGINS) margins?: (typeof CV_MARGINS)[number];
  @IsOptional() @IsIn(CV_SKILL_STYLES) skillStyle?: (typeof CV_SKILL_STYLES)[number];
  @IsOptional() @IsIn(CV_DATE_FORMATS) dateFormat?: (typeof CV_DATE_FORMATS)[number];
  @IsOptional() @IsBoolean() showPhoto?: boolean;
  @IsOptional() @IsBoolean() showIcons?: boolean;
}

// ─── Content items ─────────────────────────────────────────────────────

const Month = () => Matches(MONTH_RE, { message: 'DATE_INVALID' });

export class CvSectionDto {
  @ApiProperty({ enum: CV_SECTION_KEYS }) @IsIn(CV_SECTION_KEYS) key: CvSectionKey;
  @ApiProperty() @IsBoolean() enabled: boolean;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(60) title?: string | null;
}

export class CvExperienceDto {
  @Transform(trim) @IsString() @Length(1, 120) jobTitle: string;
  @Transform(trim) @IsString() @Length(1, 120) company: string;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(120) location?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsIn(EMPLOYMENT_TYPES) employmentType?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() startDate?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() endDate?: string | null;
  @IsOptional() @IsBoolean() current?: boolean;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(3000) responsibilities?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) achievements?: string;
}

export class CvEducationDto {
  @Transform(trim) @IsString() @Length(1, 160) degree: string;
  @Transform(trim) @IsString() @Length(1, 160) institution: string;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(120) location?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() startDate?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() endDate?: string | null;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1500) description?: string;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(40) grade?: string | null;
}

export class CvSkillDto {
  @Transform(trim) @IsString() @Length(1, 80) name: string;
  @IsOptional() @IsIn(SKILL_CATEGORIES) category?: (typeof SKILL_CATEGORIES)[number];
  @ValidateIf(isSet) @IsInt() @Min(1) @Max(5) level?: number | null;
}

export class CvProjectDto {
  @Transform(trim) @IsString() @Length(1, 120) name: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(300) technologies?: string;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) url?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) githubUrl?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() startDate?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() endDate?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(1000) image?: string | null;
}

export class CvCertificationDto {
  @Transform(trim) @IsString() @Length(1, 160) name: string;
  @Transform(trim) @IsString() @Length(1, 160) issuer: string;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() issueDate?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @Month() expirationDate?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) credentialUrl?: string | null;
}

export class CvLanguageDto {
  @Transform(trim) @IsString() @Length(1, 60) language: string;
  @IsIn(LANGUAGE_LEVELS) proficiency: (typeof LANGUAGE_LEVELS)[number];
}

export class CvExtraItemDto {
  @IsIn(EXTRA_KINDS) kind: (typeof EXTRA_KINDS)[number];
  @Transform(trim) @IsString() @Length(1, 160) title: string;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(160) subtitle?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(40) date?: string | null;
  @Transform(emptyToNull) @ValidateIf(isSet) @IsUrl(URL_OPTS) @MaxLength(500) url?: string | null;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1500) description?: string;
}

// ─── CV ────────────────────────────────────────────────────────────────

export class CreateCvDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(1, 120) title: string;
  @ApiPropertyOptional({ enum: CV_TEMPLATE_IDS }) @IsOptional() @IsIn(CV_TEMPLATE_IDS) template?: CvTemplateId;
  @ApiPropertyOptional({ enum: ['en', 'ar'] }) @IsOptional() @IsIn(['en', 'ar']) language?: 'en' | 'ar';
  /** Copy the content of one of the user's existing CVs. */
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[0-9a-f-]{36}$/i) copyFromId?: string;
}

/**
 * Autosave payload. Every field is optional; a collection that is present replaces the stored
 * one (in a single transaction), so the editor can send the whole document or only metadata.
 */
export class UpdateCvDto {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 120) title?: string;
  @ApiPropertyOptional({ enum: CV_TEMPLATE_IDS }) @IsOptional() @IsIn(CV_TEMPLATE_IDS) template?: CvTemplateId;
  @ApiPropertyOptional({ enum: ['en', 'ar'] }) @IsOptional() @IsIn(['en', 'ar']) language?: 'en' | 'ar';
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(120) fullName?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(120) headline?: string | null;
  @ApiPropertyOptional() @Transform(emptyToNull) @ValidateIf(isSet) @IsString() @MaxLength(2000) summary?: string | null;
  @ApiPropertyOptional({ type: CvDesignDto }) @IsOptional() @ValidateNested() @Type(() => CvDesignDto) design?: CvDesignDto;

  @ApiPropertyOptional({ type: [CvSectionDto] }) @IsOptional() @IsArray() @ArrayMaxSize(CV_SECTION_KEYS.length) @ValidateNested({ each: true }) @Type(() => CvSectionDto) sections?: CvSectionDto[];
  @ApiPropertyOptional({ type: [CvExperienceDto] }) @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => CvExperienceDto) experiences?: CvExperienceDto[];
  @ApiPropertyOptional({ type: [CvEducationDto] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => CvEducationDto) educations?: CvEducationDto[];
  @ApiPropertyOptional({ type: [CvSkillDto] }) @IsOptional() @IsArray() @ArrayMaxSize(80) @ValidateNested({ each: true }) @Type(() => CvSkillDto) skills?: CvSkillDto[];
  @ApiPropertyOptional({ type: [CvProjectDto] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => CvProjectDto) projects?: CvProjectDto[];
  @ApiPropertyOptional({ type: [CvCertificationDto] }) @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => CvCertificationDto) certifications?: CvCertificationDto[];
  @ApiPropertyOptional({ type: [CvLanguageDto] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => CvLanguageDto) languages?: CvLanguageDto[];
  @ApiPropertyOptional({ type: [CvExtraItemDto] }) @IsOptional() @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => CvExtraItemDto) extras?: CvExtraItemDto[];
}

export class UpdateCvSharingDto {
  @ApiPropertyOptional({ enum: ['PRIVATE', 'UNLISTED', 'PUBLIC'] }) @IsOptional() @IsIn(['PRIVATE', 'UNLISTED', 'PUBLIC']) visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowDownload?: boolean;
  /** Turns the public link on/off without changing visibility or slug. */
  @ApiPropertyOptional() @IsOptional() @IsBoolean() linkEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)) @IsString() @MaxLength(60) slug?: string;
}

export class CvPdfQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsIn(['1', 'true']) download?: string;
}
