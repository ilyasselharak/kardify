import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ANALYTICS_RANGES, CLIENT_EVENTS, type AnalyticsRange } from '../analytics.types.js';

export class TrackEventDto {
  @ApiProperty({ enum: CLIENT_EVENTS }) @IsIn(CLIENT_EVENTS) eventType: (typeof CLIENT_EVENTS)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[a-z0-9_-]{1,40}$/) meta?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) referrer?: string;
}

export class RangeQueryDto {
  @ApiPropertyOptional({ enum: ANALYTICS_RANGES }) @IsOptional() @IsIn(ANALYTICS_RANGES) range?: AnalyticsRange;
}
