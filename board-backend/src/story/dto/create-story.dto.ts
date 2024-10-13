// dto/create-story.dto.ts
import { IsNotEmpty } from 'class-validator';

export class CreateStoryDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: string;
}
