import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsHexColor,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PASSWORD_REGEX } from '../../auth/dto/auth.dto.js';
import { TEMPLATE_IDS } from '../../card-design/templates.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 80) lastName?: string;
  @ApiPropertyOptional({ enum: ['en', 'ar'] }) @IsOptional() @IsIn(['en', 'ar']) preferredLanguage?: 'en' | 'ar';
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(1000)
  profileImage?: string | null;
}

export class NotificationPreferencesDto {
  @IsOptional() @IsBoolean() productUpdates?: boolean;
  @IsOptional() @IsBoolean() weeklySummary?: boolean;
  @IsOptional() @IsBoolean() securityAlerts?: boolean;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: ['en', 'ar'] }) @IsOptional() @IsIn(['en', 'ar']) defaultCardLanguage?: 'en' | 'ar';
  @ApiPropertyOptional({ enum: TEMPLATE_IDS }) @IsOptional() @IsIn(TEMPLATE_IDS) defaultTemplate?: string;
  @ApiPropertyOptional() @IsOptional() @IsHexColor() defaultPrimaryColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsHexColor() defaultBackgroundColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsHexColor() defaultTextColor?: string;
  @ApiPropertyOptional({ type: NotificationPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MaxLength(128) currentPassword: string;
  @ApiProperty() @IsString() @Matches(PASSWORD_REGEX, { message: 'PASSWORD_WEAK' }) newPassword: string;
  @ApiProperty() @IsString() confirmPassword: string;
}

export class ChangeEmailDto {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  newEmail: string;
  @ApiProperty() @IsString() @MaxLength(128) password: string;
}

export class DeleteAccountDto {
  @ApiProperty() @IsString() @MaxLength(128) password: string;
}
