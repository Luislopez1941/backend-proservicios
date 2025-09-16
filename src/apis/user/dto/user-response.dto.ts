export class UserResponseDto {
  status: 'success' | 'warning' | 'error';
  message: string;
  data?: any;
  totalPages?: number[];
  currentPage?: number;
  pageSize?: number;
  total?: number;
}
