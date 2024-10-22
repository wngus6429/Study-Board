import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryService } from './story.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';

@Controller('api/story')
export class StoryController {
  logger: any;
  constructor(private readonly storyService: StoryService) {}

  @Get('/getall')
  async getAllStory(): Promise<any> {
    return this.storyService.findAll();
  }

  @Post('/create')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard())
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @GetUser() userData: User,
  ) {
    console.log('createStoryDto:', createStoryDto, 'userData:', userData);
    // this.logger.verbose(
    //   `User ${userData.nickname}가 새글 작성. Payload: ${JSON.stringify(userData)}`,
    // );
    return this.storyService.create(createStoryDto, userData);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard())
  async deleteStory(@Param('id') storyId: number): Promise<any> {
    console.log('storyId:', storyId);
    return this.storyService.deleteStory(storyId);
  }
}
