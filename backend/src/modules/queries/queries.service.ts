import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QueriesService {
  constructor(private readonly prisma: PrismaService) {}

  async saveQuery(userId: string, data: { name: string, query: string, visualizationType: string }) {
    return this.prisma.savedQuery.create({
      data: {
        name: data.name,
        query: data.query,
        visualization_type: data.visualizationType,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async getSavedQueries(userId: string) {
    return this.prisma.savedQuery.findMany({
      where: {
        user_id: userId,
      },
    });
  }
}
