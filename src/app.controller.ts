import { Controller, } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {

  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {
  }
}
