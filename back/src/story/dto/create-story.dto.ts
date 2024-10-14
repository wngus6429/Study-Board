// dto/create-story.dto.ts
import { IsNotEmpty, Max, MaxLength } from 'class-validator';

export class CreateStoryDto {
  @IsNotEmpty()
  @MaxLength(1000)
  title: string;

  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
