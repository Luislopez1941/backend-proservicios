import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewUserDto } from './dto/create-review-user.dto';
import { UpdateReviewUserDto } from './dto/update-review-user.dto';

@Injectable()
export class ReviewUserService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewUserDto: CreateReviewUserDto) {
    try {
      // Verificar que no exista ya una reseña del mismo usuario para el mismo trabajo
      if (createReviewUserDto.job_id) {
        const existingReview = await this.prisma.review.findFirst({
          where: {
            reviewer_id: createReviewUserDto.reviewer_id,
            reviewed_id: createReviewUserDto.reviewed_id,
            job_id: createReviewUserDto.job_id
          }
        });

        if (existingReview) {
          throw new ConflictException('Ya existe una reseña para este trabajo');
        }
      }

      // Crear la reseña
      const review = await this.prisma.review.create({
        data: createReviewUserDto,
        include: {
          reviewer: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          },
          reviewed: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          }
        }
      });

      // Actualizar el rating promedio del usuario reseñado
      await this.updateUserRating(createReviewUserDto.reviewed_id);

      return {
        status: 'success',
        message: 'Reseña creada exitosamente',
        data: review
      };
    } catch (error) {
      console.error('Error creating review:', error);
      return {
        status: 'error',
        message: error.message || 'Error al crear la reseña',
        data: null
      };
    }
  }

  async findAll() {
    try {
      const reviews = await this.prisma.review.findMany({
        include: {
          reviewer: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          },
          reviewed: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return {
        status: 'success',
        message: 'Reseñas obtenidas exitosamente',
        data: reviews
      };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return {
        status: 'error',
        message: 'Error al obtener las reseñas',
        data: null
      };
    }
  }

  async findOne(id: number) {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id },
        include: {
          reviewer: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          },
          reviewed: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          }
        }
      });

      if (!review) {
        throw new NotFoundException('Reseña no encontrada');
      }

      return {
        status: 'success',
        message: 'Reseña obtenida exitosamente',
        data: review
      };
    } catch (error) {
      console.error('Error fetching review:', error);
      return {
        status: 'error',
        message: error.message || 'Error al obtener la reseña',
        data: null
      };
    }
  }

  async findByUserId(userId: number) {
    try {
      const reviews = await this.prisma.review.findMany({
        where: { reviewed_id: userId },
        include: {
          reviewer: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return {
        status: 'success',
        message: 'Reseñas del usuario obtenidas exitosamente',
        data: reviews
      };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return {
        status: 'error',
        message: 'Error al obtener las reseñas del usuario',
        data: null
      };
    }
  }

  async update(id: number, updateReviewUserDto: UpdateReviewUserDto) {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        throw new NotFoundException('Reseña no encontrada');
      }

      const updatedReview = await this.prisma.review.update({
        where: { id },
        data: {
          ...updateReviewUserDto,
          updated_at: new Date()
        },
        include: {
          reviewer: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          },
          reviewed: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          }
        }
      });

      // Actualizar el rating promedio del usuario reseñado
      await this.updateUserRating(review.reviewed_id);

      return {
        status: 'success',
        message: 'Reseña actualizada exitosamente',
        data: updatedReview
      };
    } catch (error) {
      console.error('Error updating review:', error);
      return {
        status: 'error',
        message: error.message || 'Error al actualizar la reseña',
        data: null
      };
    }
  }

  async remove(id: number) {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        throw new NotFoundException('Reseña no encontrada');
      }

      await this.prisma.review.delete({
        where: { id }
      });

      // Actualizar el rating promedio del usuario reseñado
      await this.updateUserRating(review.reviewed_id);

      return {
        status: 'success',
        message: 'Reseña eliminada exitosamente',
        data: null
      };
    } catch (error) {
      console.error('Error deleting review:', error);
      return {
        status: 'error',
        message: error.message || 'Error al eliminar la reseña',
        data: null
      };
    }
  }

  private async updateUserRating(userId: number) {
    try {
      const reviews = await this.prisma.review.findMany({
        where: { reviewed_id: userId },
        select: { rating: true }
      });

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            rating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
            reviewsCount: reviews.length
          }
        });
      }
    } catch (error) {
      console.error('Error updating user rating:', error);
    }
  }
}
