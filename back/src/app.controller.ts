import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Story } from './entities/Story.entity';
import { CreateStoryDto } from './story/dto/create-story.dto';

// 라우트 하나만 있는 기본적인 컨트롤러가 있는 파일
@Controller('/story')
export class AppController {}
