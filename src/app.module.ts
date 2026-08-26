import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { BoardsModule } from './boards/boards.module';
import { RolloverModule } from './rollover/rollover.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, TasksModule, BoardsModule, RolloverModule],
})
export class AppModule {}
