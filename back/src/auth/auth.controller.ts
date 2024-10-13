import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth.user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authUserService: AuthService) {}

  @Post('signup')
  async signup(@Body() userData: AuthUserDto): Promise<void> {
    console.log('userData:', userData);
    return await this.authUserService.signUp(userData);
  }

  // @Post('signin')
  // async signin(
  //   @Body(ValidationPipe) userData: AuthUserDto,
  // ): Promise<{ accessToken: string }> {}
}
