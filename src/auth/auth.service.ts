import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorUserDto } from './dto/error-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  private microServiceError(errorUserDto: ErrorUserDto) {
    throw new RpcException({
      statusCode: errorUserDto.statusCode,
      message: errorUserDto.message,
      error: errorUserDto.error,
    });
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { name, email, password } = registerUserDto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (user) {
      this.microServiceError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User already exists',
        error: 'Bad Request',
      });
    }

    try {
      const newUser = await this.prismaService.user.create({
        data: {
          name,
          email,
          password: bcrypt.hashSync(password, 10),
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return {
        user: newUser,
      };
    } catch (error) {
      console.log(error);
      this.microServiceError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong. Try again !',
        error: 'Internal server error',
      });
    }
  }
}
