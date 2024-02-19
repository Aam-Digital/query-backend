import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlParser {
  getPlaceholder(url: string): string[] {
    const pattern = /<([^<>]+)>/g;

    return url.match(pattern) || [];
  }

  replacePlaceholder(
    url: string,
    args: {
      [key: string]: string;
    },
  ): string {
    const pathParamsKeys = Object.keys(args);

    for (let i = 0; i < pathParamsKeys.length; i++) {
      url = url.replace(`<${pathParamsKeys[i]}>`, args[pathParamsKeys[i]]);
    }

    return url;
  }
}
