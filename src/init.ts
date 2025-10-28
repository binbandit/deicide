import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, relative, resolve } from "path";
import { globby } from "globby";
import { PackageInfo, TsConfig } from "./types";
import { detectPackageManager } from "./packageManager";

export async function initCommand(cwd: string = process.cwd()) {
  // Find package.json
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) {
    throw new Error("No package.json found in current directory");
  }

  // Read workspaces
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const workspaces = pkg.workspaces || [];
  if (!workspaces.length) {
    throw new Error("No workspaces defined in package.json");
  }

  // Discover packages
  const packages: PackageInfo[] = [];
  for (const pattern of workspaces) {
    const paths = await globby(pattern, { cwd, absolute: true });
    for (const path of paths) {
      const pkgJson = join(path, "package.json");
      if (existsSync(pkgJson)) {
        const pkgData = JSON.parse(readFileSync(pkgJson, "utf-8"));
        packages.push({
          name: pkgData.name,
          path,
          relativePath: relative(cwd, path),
        });
      }
    }
  }

  if (!packages.length) {
    throw new Error("No packages found in workspaces");
  }

  // Generate root tsconfig.json
  const rootTsConfig: TsConfig = {
    compilerOptions: {
      composite: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      module: "ESNext",
      target: "ESNext",
      moduleResolution: "Bundler",
      skipLibCheck: true,
      isolatedModules: true,
      isolatedDeclarations: true, // TS 5.9 flag for faster inference
      baseUrl: ".",
      paths: Object.fromEntries(
        packages.map((pkg) => [pkg.name, [`${pkg.relativePath}/src`]])
      ),
    },
    references: packages.map((pkg) => ({ path: join(pkg.relativePath, "tsconfig.json") })),
    include: ["**/*.ts", "**/*.tsx"],
    exclude: ["node_modules", "dist"],
  };
  writeFileSync(
    join(cwd, "tsconfig.json"),
    JSON.stringify(rootTsConfig, null, 2)
  );

  // Generate per-package tsconfig.json
  for (const pkg of packages) {
    const pkgTsConfig: TsConfig = {
      compilerOptions: {
        composite: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: "./dist",
        rootDir: "./src",
        module: "ESNext",
        target: "ESNext",
        moduleResolution: "Bundler",
        skipLibCheck: true,
        isolatedModules: true,
        isolatedDeclarations: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };
    writeFileSync(
      join(pkg.path, "tsconfig.json"),
      JSON.stringify(pkgTsConfig, null, 2)
    );
  }

  console.log(`Generated tsconfig.json for ${packages.length} packages`);

  const manager = detectPackageManager(cwd);
  if (manager === "yarn-berry") {
    console.log("\nDetected Yarn Berry (with PnP). To enable full TypeScript support in VS Code:");
    console.log("Run: yarn dlx @yarnpkg/sdks vscode");
    console.log("This sets up the Yarn TS SDK for proper module resolution.");
  } else if (manager === "unknown") {
    console.log("\nCould not detect package manager. Ensure your repo has a lock file (package-lock.json, yarn.lock, or pnpm-lock.yaml).");
  }

  console.log("\nRun `deicide ts-doctor` to check for LSP issues");
}
