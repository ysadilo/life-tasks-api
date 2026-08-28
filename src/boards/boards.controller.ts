import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Auth0AuthGuard } from '../auth/auth0-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('boards')
@UseGuards(Auth0AuthGuard)
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get()
  findMine(@CurrentUser() userId: string) {
    return this.boards.findByOwner(userId);
  }

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: { name: string }) {
    // ponytail: assumes the caller's User row exists (created on first /tasks call).
    // The client only creates boards via the Today/Backlog flow, never here.
    return this.boards.create(userId, dto.name);
  }
}
