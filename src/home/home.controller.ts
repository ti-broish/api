import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/Public.decorator';

@Controller()
export class HomeController {

  @Get()
  @Public()
  home() {
    return {hello: 'world'};
  }
}
