import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Inject,
  ParseIntPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../../../../../common/decorators/get-user.decorator'; // 기존 데코레이터 경로 임시 지정 (경로에 맞게 수정 필요)
import { User } from '../../../../../entities/user.entity'; // 기존 유저 엔티티
import { BOARD_USE_CASE, BoardUseCase } from '../../../../core/application/ports/in/board.use-case';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Clean-Board (클린 아키텍처 예제)')
@Controller('api/board-clean')
export class BoardController {
  constructor(
    // ✨ 핵심: Service 구현체가 아닌 Use Case(인터페이스)를 주입받습니다.
    @Inject(BOARD_USE_CASE)
    private readonly boardUseCase: BoardUseCase,
  ) {}

  @Post('/create')
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: '새 게시글 작성 (클린 아키텍처)' })
  async createBoard(
    @Body() dto: CreateBoardDto,
    @GetUser() user: User, // 로그인한 유저 정보
  ) {
    // Controller는 DTO를 Command(애플리케이션 요청 구조)로 변환해 UseCase로 전달
    return this.boardUseCase.createBoard({
      title: dto.title,
      content: dto.content,
      category: dto.category,
      authorId: user.id,
    });
  }

  @Get('/list')
  @ApiOperation({ summary: '게시글 목록 조회 (클린 아키텍처)' })
  async getBoards(
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.boardUseCase.getBoards(offset, limit);
  }

  @Get('/:id')
  @ApiOperation({ summary: '게시글 상세 조회 (클린 아키텍처)' })
  async getBoardById(@Param('id', ParseIntPipe) id: number) {
    return this.boardUseCase.getBoardById(id);
  }

  @Put('/:id')
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: '게시글 수정 (클린 아키텍처)' })
  async updateBoard(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBoardDto,
    @GetUser() user: User,
  ) {
    return this.boardUseCase.updateBoard({
      boardId: id,
      title: dto.title,
      content: dto.content,
      authorId: user.id,
    });
  }

  @Delete('/:id')
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: '게시글 삭제 (클린 아키텍처)' })
  async deleteBoard(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    await this.boardUseCase.deleteBoard(id, user.id);
    return { message: '게시글이 삭제되었습니다.' };
  }
}
