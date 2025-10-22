import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewUserDto } from './dto/create-review-user.dto';
import { UpdateReviewUserDto } from './dto/update-review-user.dto';

@Injectable()
export class ReviewUserService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewUserDto: CreateReviewUserDto) {
    try {
      const { proposalId, proposal_id, reviewer_id, receiver_id, data } = createReviewUserDto;

      // Usar proposalId o proposal_id (el que esté definido)
      const actualProposalId = proposalId || proposal_id;
      
      if (!actualProposalId) {
        throw new ConflictException('Se requiere proposalId o proposal_id');
      }

      // Buscar la propuesta por proposalId
      const proposal = await this.prisma.jobProposal.findUnique({
        where: { id: actualProposalId },
        include: {
          message: true
        }
      });

      if (!proposal) {
        throw new NotFoundException('Propuesta no encontrada');
      }

      // Determinar cuál campo actualizar y con qué usuario enlazar la reseña
      let updateField: 'review_status_reviewer' | 'review_status_receiver';
      let userId: number;

      if (reviewer_id && reviewer_id !== null) {
        // Si reviewer_id está definido, actualizar review_status_reviewer
        // y enlazar la reseña con el reviewer_id
        updateField = 'review_status_reviewer';
        userId = reviewer_id;
      } else if (receiver_id && receiver_id !== null) {
        // Si receiver_id está definido, actualizar review_status_receiver
        // y enlazar la reseña con el receiver_id
        updateField = 'review_status_receiver';
        userId = receiver_id;
      } else {
        throw new ConflictException('Se requiere reviewer_id o receiver_id');
      }

      // Verificar que no exista ya una reseña del mismo usuario para esta propuesta
      const existingReview = await this.prisma.review.findFirst({
        where: {
          user_id: userId,
          job_id: data.job_id || null
        }
      });

      if (existingReview) {
        throw new ConflictException('Ya existe una reseña para esta propuesta');
      }

      // Actualizar el campo review_status correspondiente en la propuesta
      await this.prisma.jobProposal.update({
        where: { id: actualProposalId },
        data: {
          [updateField]: true
        }
      });

      // Crear la reseña usando los datos de data
      const review = await this.prisma.review.create({
        data: {
          user_id: userId,
          comment: data.comment,
          job_id: data.job_id || null
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          }
        }
      });

      // Actualizar el rating promedio del usuario (ya no es necesario ya que no hay rating en la nueva estructura)
      // await this.updateUserRating(userId);

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
          user: {
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
          user: {
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
        where: { user_id: userId },
        include: {
          user: {
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
          user: {
            select: {
              id: true,
              first_name: true,
              first_surname: true,
              profilePhoto: true
            }
          }
        }
      });

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

}
