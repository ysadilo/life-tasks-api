import { Module } from '@nestjs/common';
import { RolloverService } from './rollover.service';
import { RolloverCron } from './rollover.cron';
import { RolloverDevController } from './rollover.dev.controller';

@Module({
  controllers: process.env.NODE_ENV === 'production' ? [] : [RolloverDevController],
  providers: [RolloverService, RolloverCron],
  exports: [RolloverService],
})
export class RolloverModule {}
