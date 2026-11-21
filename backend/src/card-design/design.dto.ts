import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsHexColor, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import {
  BACK_LAYOUTS,
  BACKGROUND_TYPES,
  CONTACT_ICON_STYLES,
  PATTERNS,
  FONT_FAMILIES,
  FONT_SIZES,
  LAYOUTS,
  LOGO_POSITIONS,
  PHOTO_SHAPES,
  SOCIAL_ICON_STYLES,
  TEMPLATE_IDS,
} from './design.types.js';

class FaceDesignDto {
  @IsOptional() @IsIn(BACKGROUND_TYPES) backgroundType?: (typeof BACKGROUND_TYPES)[number];
  @IsOptional() @IsHexColor() backgroundColor?: string;
  @IsOptional() @IsHexColor() gradientFrom?: string;
  @IsOptional() @IsHexColor() gradientTo?: string;
  @IsOptional() @IsInt() @Min(0) @Max(360) gradientAngle?: number;
  @IsOptional() @IsHexColor() textColor?: string;
}

export class BackDesignDto extends FaceDesignDto {
  @IsOptional() @IsIn(BACK_LAYOUTS) layout?: (typeof BACK_LAYOUTS)[number];
  @IsOptional() @IsBoolean() showQr?: boolean;
  @IsOptional() @IsString() @MaxLength(120) tagline?: string;
}

/** Every field optional: missing values are filled from the chosen template. */
export class DesignSettingsDto extends FaceDesignDto {
  @ApiPropertyOptional({ enum: TEMPLATE_IDS }) @IsOptional() @IsIn(TEMPLATE_IDS) template?: (typeof TEMPLATE_IDS)[number];
  @IsOptional() @IsHexColor() primaryColor?: string;
  @IsOptional() @IsHexColor() secondaryColor?: string;
  @IsOptional() @IsIn(CONTACT_ICON_STYLES) contactIconStyle?: (typeof CONTACT_ICON_STYLES)[number];
  @IsOptional() @IsIn(PATTERNS) pattern?: (typeof PATTERNS)[number];
  /** '' clears the image; otherwise an https URL (uploads are re-encoded and hosted on Cloudinary). */
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(1000) backgroundImage?: string;
  @IsOptional() @IsInt() @Min(0) @Max(90) backgroundOverlay?: number;
  @IsOptional() @IsIn(FONT_FAMILIES) fontFamily?: (typeof FONT_FAMILIES)[number];
  @IsOptional() @IsIn(FONT_SIZES) fontSize?: (typeof FONT_SIZES)[number];
  @IsOptional() @IsInt() @Min(0) @Max(40) borderRadius?: number;
  @IsOptional() @IsIn(LAYOUTS) layout?: (typeof LAYOUTS)[number];
  @IsOptional() @IsIn(PHOTO_SHAPES) photoShape?: (typeof PHOTO_SHAPES)[number];
  @IsOptional() @IsIn(LOGO_POSITIONS) logoPosition?: (typeof LOGO_POSITIONS)[number];
  @IsOptional() @IsIn(SOCIAL_ICON_STYLES) socialIconStyle?: (typeof SOCIAL_ICON_STYLES)[number];
  @IsOptional() @ValidateNested() @Type(() => BackDesignDto) back?: BackDesignDto;
}
