import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { envs } from 'src/configs/envs';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorUserDto } from './dto/error-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

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
        token: await this.signJwt(newUser),
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

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      this.microServiceError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid credentials',
        error: 'Bad Request',
      });
    }

    const { password: userPassword, ...rest } = user;

    const passwordIdValid = await bcrypt.compare(password, userPassword);

    if (!passwordIdValid) {
      this.microServiceError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid credentials',
        error: 'Bad Request',
      });
    }

    return {
      user: rest,
      token: await this.signJwt(rest),
    };
  }

  async verifyToken(token: string) {
    try {
      const { id, name, email } = this.jwtService.verify(token, {
        secret: envs.JWT_SECRET,
      });

      const user = { id, name, email };

      return {
        user,
        token: await this.signJwt(user),
      };
    } catch (error) {
      console.log(error);
      this.microServiceError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    }
  }
}
