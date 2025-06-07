// dto/create-story.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  Max,
  MaxLength,
  IsNumberString,
} from 'class-validator';

export class CreateStoryDto {
  @IsNotEmpty()
  @MaxLength(1000)
  title: string;

  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsNumberString()
  channelId?: string;

  @IsOptional()
  preview: { dataUrl: string; fileName: string }[];
}
