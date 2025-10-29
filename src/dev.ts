import { topoSort } from "./utils";
import { execa } from "execa";
import ora from "ora";
import { discoverPackages } from "./utils";

interface DevOptions {
  app: string;
}

export async function devCommand(app: string, cwd: string = process.cwd()) {
  const packages = await discoverPackages(cwd);
  const appPkg = packages.find(pkg => pkg.name === app);
  if (!appPkg) {
    throw new Error(`App package "${app}" not found`);
  }

  const startupOrder = topoSort(packages, app);
  const processes = new Map<string, ReturnType<typeof execa>>();

  const spinner = ora(`Starting ${startupOrder.length}packages for ${app}`).start();

  try {
    for (const pkgName of startupOrder) {
      const pkg = packages.find(p => p.name === pkgName)!;
      spinner.text = `Starting ${pkgName}...`;

      // Assume "dev" script; customizable later
      const proc = execa("npm", ["run", "dev"], { cwd: pkg.path, stdio: "pipe" });

      proc.stdout?.on("data", (data) => {
        console.log(`[${pkgName}] ${data.toString().trim()}`)
      });
      proc.stderr?.on("data", (data) => {
        console.error(`[${pkgName}]${data.toString().trim()}`);
      });
      process.set(pkgName, proc);

      // Simple readiness wait
      await new Promise<void>((resolve) => {
        proc.stdout?.on("data", (data) => {
          if (data.toString().includes("ready")) resolve();
        });

        setTimeout(resolve, 30_000);
      });

      spinner.text = `${pkgName} started`;
    }
    spinner.succeed(`All deps for ${app} are up. Press Ctrl+C to exit.`);

    process.on("SIGINT", () => teardown(processes, spinner));
  } catch (err) {
    spinner.fail(`Error: ${err.message}`);
    teardown(processes, spinner);
    process.exit(1);
  }
}

function teardown(processes: Map<string, ReturnType<typeof execa>>, spinner: ReturnType<typeof ora>) {
  spinner.text = `Tearing down...`;
  for (const proc of processes.values()) {
    proc.kill();
  }
  spinner.succeed("Shutdown complete");
}

console.log("\nNote: deicide's dev command is editor-agnostic and focuses on CLI orchestration. For LSP setup in Neovim, use nvim-lspconfig with tsserver. In JetBrains, enable TS service with monorepo path mappings.");
