import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { validarLogin, validarRegistro } from './dto/auth.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() cuerpo: unknown) {
    return this.auth.register(validarRegistro(cuerpo));
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() cuerpo: unknown) {
    return this.auth.login(validarLogin(cuerpo));
  }
}
