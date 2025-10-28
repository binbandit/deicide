import { join } from 'node:path';
import { existsSync } from 'node:fs';

export type PackageManager = 'npm' | 'yarn-berry' | 'yarn-classic' | 'pnpm' | 'uknown';

export function detectPackageManager(cwd: string): PackageManager {
  const pnpmLock = join(cwd, 'pnpm-lock.yaml');
  const yarnLock = join(cwd, 'yarn.lock');
  const npmLock = join(cwd, 'package-lock.json');
  const yarnRc = join(cwd, '.yarnrc');
  const pnpFile = join(cwd, '.pnp.cjs');

  switch (true) {
    case existsSync(pnpmLock):
      return 'pnpm';
    case existsSync(npmLock):
      return 'npm';
    case existsSync(yarnRc) || existsSync(pnpFile):
      return 'yarn-berry';
    case existsSync(yarnLock):
      return 'yarn-classic';
    default:
      return 'uknown';
  }
}
