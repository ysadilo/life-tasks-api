import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BoardsService } from './boards.service';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get()
  findByOwner(@Query('ownerId') ownerId: string) {
    return this.boards.findByOwner(ownerId);
  }

  @Post()
  create(@Body() dto: { ownerId: string; name: string }) {
    return this.boards.create(dto.ownerId, dto.name);
  }
}
