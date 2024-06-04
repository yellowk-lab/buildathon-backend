import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';

@Injectable()
export class MomentService {
  private momentProxy: typeof moment;

  constructor(private readonly configService: ConfigService) {
    moment.locale(this.configService.get('DEFAULT_LOCALE') || 'en');

    this.momentProxy = new Proxy(moment, {
      get: (target, property) => {
        if (typeof target[property] === 'function') {
          return (...args: any) => target[property](...args);
        }
        return target[property];
      },
    });
  }

  changeLocale(newLocale: string): void {
    moment.locale(newLocale);
  }

  get() {
    return this.momentProxy;
  }
}
