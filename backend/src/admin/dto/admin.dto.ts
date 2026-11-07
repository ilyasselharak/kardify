import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class PageQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class AdminUsersQueryDto extends PageQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) search?: string;
  @ApiPropertyOptional({ enum: ['USER', 'ADMIN'] }) @IsOptional() @IsIn(['USER', 'ADMIN']) role?: 'USER' | 'ADMIN';
  @ApiPropertyOptional({ enum: ['active', 'suspended', 'unverified'] })
  @IsOptional() @IsIn(['active', 'suspended', 'unverified']) status?: 'active' | 'suspended' | 'unverified';
  @ApiPropertyOptional({ enum: ['newest', 'oldest'] }) @IsOptional() @IsIn(['newest', 'oldest']) sort?: 'newest' | 'oldest';
}

export class AdminCardsQueryDto extends PageQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) search?: string;
  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE', 'INACTIVE'] })
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE']) status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(1, 80) lastName?: string;
  @ApiPropertyOptional({ enum: ['en', 'ar'] }) @IsOptional() @IsIn(['en', 'ar']) preferredLanguage?: 'en' | 'ar';
  @ApiPropertyOptional({ enum: ['USER', 'ADMIN'] }) @IsOptional() @IsIn(['USER', 'ADMIN']) role?: 'USER' | 'ADMIN';
  @ApiPropertyOptional() @IsOptional() @IsBoolean() emailVerified?: boolean;
}
