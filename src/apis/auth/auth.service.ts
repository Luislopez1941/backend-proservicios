import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const { email, password } = loginDto;

      // Buscar usuario por email
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          first_name: true,
          first_surname: true,
          type_user: true,
          verified: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token JWT
      const payload = { 
        sub: user.id, 
        email: user.email,
        type_user: user.type_user 
      };
      const token = this.jwtService.sign(payload);

      // Retornar respuesta exitosa
      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          first_surname: user.first_surname,
          type_user: user.type_user || undefined,
        },
        status: 'success',
        message: 'Login exitoso',
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Error al procesar el login');
    }
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
