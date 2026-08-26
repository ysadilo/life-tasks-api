import { Controller, Post } from '@nestjs/common';
import { RolloverService } from './rollover.service';

// Only registered when NODE_ENV !== "production" — see RolloverModule.
@Controller('dev/rollover')
export class RolloverDevController {
  constructor(private readonly rollover: RolloverService) {}

  @Post()
  trigger() {
    return this.rollover.runRollover();
  }
}
