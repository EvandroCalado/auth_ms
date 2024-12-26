import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [PrismaService],
})
export class AuthModule {}
