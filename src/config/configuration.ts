import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const CONFIG_FILENAME = 'app.yaml';

export function AppConfiguration() {
  return flatten(
    yaml.load(readFileSync(join(__dirname, CONFIG_FILENAME), 'utf8')) as Record<
      string,
      string
    >,
  );
}

function flatten(obj: any, prefix = '', delimiter = '_') {
  return Object.keys(obj).reduce((acc: any, k: string) => {
    const pre = prefix.length ? prefix + delimiter : '';

    if (typeof obj[k] === 'object')
      Object.assign(acc, flatten(obj[k], pre + k));
    else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}
