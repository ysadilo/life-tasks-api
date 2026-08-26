import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RolloverService } from './rollover.service';

@Injectable()
export class RolloverCron {
  constructor(private readonly rollover: RolloverService) {}

  @Cron(process.env.ROLLOVER_CRON ?? '0 0 * * *')
  handle() {
    return this.rollover.runRollover();
  }
}
