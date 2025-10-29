import { relative, join } from "node:path";
import { execa } from "execa";
import { existsSync, readFileSync } from "node:fs";
import { globby } from "globby";
import { PackageInfo } from "./types";

// Simple topo sort for DAG
export function topoSort(packages: PackageInfo[], appName: string): string[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const allNames = new Set<string>();

  packages.forEach((pkg) => {
    allNames.add(pkg.name);
    graph.set(pkg.name, pkg.dependencies.filter(dep => allNames.has(dep)));
    inDegree.set(pkg.name, 0);
  });

  // Build inDegrees
  for (const deps of graph.values()) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }

  // Start from app and traverse dependencies (reverse topo for startup: deps first)
  const queue: string[] = [];
  const visited = new Set<string>();
  function dfs(node: string) {
    if (visited.has(node)) return;
    visited.add(node);
    const deps = graph.get(node) || [];
    for (const dep of deps) {
      dfs(dep);
    }
    queue.push(node);
  }
  dfs(appName);

  // filter to only deps + app
  return queue.reverse(); // Deps first
}

export async function discoverPackages(cwd: string): Promise<PackageInfo[]> {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) {
    throw new Error("No package.json found");
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const workspaces = pkg.workspaces || [];
  if (!workspaces.length) {
    throw new Error("No workspaces defined");
  }

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
          dependencies: Object.keys(pkgData.dependencies || {}).filter(dep => dep.startsWith("@"))
        });
      }
    }
  }
  return packages;
}

// Get changed files from git
export async function getChangedFiles(cwd: string): Promise<string[]> {
  const { stdout } = await execa("git", ["status", "--porcelain"], { cwd });
  return stdout.split("\n").map(line => line.trim().split(/\s+/).pop() || "").filter(Boolean);
}

// Map changed files to affected packages
export function getAffectedPackages(packages: PackageInfo[], changedFiles: string[]): PackageInfo[] {
  const affected = new Set<PackageInfo>();

  changedFiles.forEach(file => {
    const pkg = packages.find(p => file.startsWith(p.relativePath));
    if (pkg) {
      affected.add(pkg);
      // Add dependents (reverse deps)
      addDependents(packages, pkg, affected);
    }
  });

  return Array.from(affected);
}

export function addDependents(packages: PackageInfo[], pkg: PackageInfo, affected: Set<PackageInfo>) {
  packages.forEach(other => {
    if (other.dependencies.includes(pkg.name)) {
      if (!affected.has(other)) {
        affected.add(other);
        addDependents(packages, other, affected);
      }
    }
  });
}

