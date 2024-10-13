import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './story/Story.entity';
import { CreateStoryDto } from './story/dto/create-story.dto';

// 메서드 하나만 있는 기본적인 서비스가 있는 파일
@Injectable()
export class AppService {}
