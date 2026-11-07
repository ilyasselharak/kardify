import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** At least 8 chars with upper, lower, digit and symbol. Mirrored by the frontend Zod schema. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export class PasswordFields {
  @ApiProperty({ minLength: 8, example: 'Str0ng!Passw0rd' })
  @IsString()
  @Matches(PASSWORD_REGEX, { message: 'PASSWORD_WEAK' })
  password: string;
}

export class RegisterDto extends PasswordFields {
  @ApiProperty() @Transform(trim) @IsString() @Length(1, 80) firstName: string;
  @ApiProperty() @Transform(trim) @IsString() @Length(1, 80) lastName: string;
  @ApiProperty() @Transform(normalizeEmail) @IsEmail({}, { message: 'EMAIL_INVALID' }) @MaxLength(254) email: string;
  @ApiProperty() @IsString() confirmPassword: string;
  @ApiProperty() @IsBoolean() @Equals(true, { message: 'TERMS_REQUIRED' }) acceptTerms: boolean;
  @ApiPropertyOptional({ enum: ['en', 'ar'] }) @IsOptional() @IsIn(['en', 'ar']) language?: 'en' | 'ar';
}

export class LoginDto {
  @ApiProperty() @Transform(normalizeEmail) @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(128) password: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rememberMe?: boolean;
}

export class EmailDto {
  @ApiProperty() @Transform(normalizeEmail) @IsEmail() email: string;
}

export class OptionalEmailDto {
  @ApiPropertyOptional() @IsOptional() @Transform(normalizeEmail) @IsEmail() email?: string;
}

export class TokenDto {
  @ApiProperty() @IsString() @Length(20, 128) token: string;
}

export class ResetPasswordDto extends PasswordFields {
  @ApiProperty() @IsString() @Length(20, 128) token: string;
  @ApiProperty() @IsString() confirmPassword: string;
}
