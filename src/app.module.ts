import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { BoardsModule } from './boards/boards.module';
import { RolloverModule } from './rollover/rollover.module';
import { LifeAreasModule } from './life-areas/life-areas.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, TasksModule, BoardsModule, RolloverModule, LifeAreasModule],
})
export class AppModule {}
