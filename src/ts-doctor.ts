import { existsSync, readFileSync } from "node:fs";
import { join } from 'node:path';
import { globby } from 'globby';
import { detectPackageManager } from './packageManager';

export async function tsDoctorCommand(cwd: string = process.cwd()) {
  // Count TS/TSX files
  const files = await globby(['**/*.ts', '**/*.tsx', '!node_modules', '!dist'], {
    cwd,
    absolute: true,
  });

  const fileCount = files.length;
  const warnings: string[] = [];

  if (fileCount > 2_000) {
    warnings.push(
      `High file count (${fileCount}): LSP may lag on low-memory systems (<16GB RAM). Consider splitting large packages or enabling incremental: true in tsconfig.json.`
    );
  }

  // Check for common LSP-killers
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = {
      ...pkg.dependencies, ...pkg.devDependencies
    };
    if (deps['zod'] || deps['arktype']) {
      warnings.push(
        `Zod/ArkType detected: Ensure TS 5.9+ with isolatedDeclarations to void O(3^N) inference lag.`
      )
    }

    // Yarn Berry specific check
    const manager = detectPackageManager(cwd);
    if (manager === 'yarn-berry') {
      const tsSdkPath = join(cwd, '.yarn/sdks/typescript');
      if (!existsSync(tsSdkPath)) {
        warnings.push(
          `Yarn Berry detected but missing TS SDK. Run 'yarn dlx @yarnpkg/sdks vscode' to enable proper TypeScript resolution with PnP.`
        );
      }
    }

    console.log(`TS Doctor Report:`);
    console.log(`- Package Manager: ${manager}`);
    console.log(`- Files scanned: ${fileCount}`);
    if (warnings.length) {
      console.log(`- Warnings:`);
      warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    } else {
      console.log(`- No major LSP issues detected. Your monorepo is healthy!`);
    }
  }
}
