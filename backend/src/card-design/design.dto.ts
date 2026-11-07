import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsHexColor, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import {
  BACKGROUND_TYPES,
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
  @IsOptional() @IsBoolean() showQr?: boolean;
  @IsOptional() @IsString() @MaxLength(120) tagline?: string;
}

/** Every field optional: missing values are filled from the chosen template. */
export class DesignSettingsDto extends FaceDesignDto {
  @ApiPropertyOptional({ enum: TEMPLATE_IDS }) @IsOptional() @IsIn(TEMPLATE_IDS) template?: (typeof TEMPLATE_IDS)[number];
  @IsOptional() @IsHexColor() primaryColor?: string;
  @IsOptional() @IsIn(FONT_FAMILIES) fontFamily?: (typeof FONT_FAMILIES)[number];
  @IsOptional() @IsIn(FONT_SIZES) fontSize?: (typeof FONT_SIZES)[number];
  @IsOptional() @IsInt() @Min(0) @Max(40) borderRadius?: number;
  @IsOptional() @IsIn(LAYOUTS) layout?: (typeof LAYOUTS)[number];
  @IsOptional() @IsIn(PHOTO_SHAPES) photoShape?: (typeof PHOTO_SHAPES)[number];
  @IsOptional() @IsIn(LOGO_POSITIONS) logoPosition?: (typeof LOGO_POSITIONS)[number];
  @IsOptional() @IsIn(SOCIAL_ICON_STYLES) socialIconStyle?: (typeof SOCIAL_ICON_STYLES)[number];
  @IsOptional() @ValidateNested() @Type(() => BackDesignDto) back?: BackDesignDto;
}
