export class AuthResponseDto {
  user: {
    id: number;
    email: string;
    first_name: string;
    first_surname: string;
    type_user?: string;
  };
  status: string;
  message: string;
  token: string;
}
