import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  findByOwner(ownerId: string) {
    return this.prisma.board.findMany({ where: { ownerId } });
  }

  create(ownerId: string, name: string) {
    return this.prisma.board.create({ data: { ownerId, name } });
  }
}
