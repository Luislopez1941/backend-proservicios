import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      email: { type: 'string', example: 'usuario@ejemplo.com' },
      first_name: { type: 'string', example: 'Juan' },
      first_surname: { type: 'string', example: 'Pérez' },
      type_user: { type: 'string', example: 'customer' }
    },
    nullable: true
  })
  user?: {
    id: number;
    email: string;
    first_name: string;
    first_surname: string;
    type_user?: string;
  };

  @ApiProperty({
    description: 'Estado de la respuesta',
    example: 'success',
    type: 'string'
  })
  status: string;

  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Login exitoso',
    type: 'string'
  })
  message: string;

  @ApiProperty({
    description: 'Token JWT para autenticación',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: 'string',
    nullable: true
  })
  token?: string;
}
