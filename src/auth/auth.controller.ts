import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor() {}

  @MessagePattern('auth.register.user')
  registerUser() {
    return 'register user';
  }

  @MessagePattern('auth.login.user')
  loginUser() {
    return 'login user';
  }

  @MessagePattern('auth.verify.user')
  verifyToken() {
    return 'verify user';
  }
}
