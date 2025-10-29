import { execa } from "execa";
import ora from "ora";
import { discoverPackages, getAffectedPackages, getChangedFiles } from "./utils";

interface CiOptions {
  affected: boolean;
  task: string; // e.g., "test", "build" - default "test"
}

export async function ciCommand(options: { affected?: boolean }, cwd: string = process.cwd()) {
  const packages = await discoverPackages(cwd);
  let toRun = packages;

  if (options.affected) {
    const changed = await getChangedFiles(cwd);
    toRun = getAffectedPackages(packages, changed);
    if (!toRun.length) {
      console.log("No affected packages.");
      return;
    }
  }

  const spinner = ora(`Running CI on ${toRun.length} packages`).start();
  const task = "test"; // Hardcoded; make configurable later

  try {
    for (const pkg of toRun) {
      spinner.text = `Running ${task} for ${pkg.name}`;
      await execa("npm", ["run", task], { cwd: pkg.path, stdio: "inherit" });
    }
    spinner.succeed("CI complete");
  } catch (err) {
    spinner.fail(`Error: ${err.message}`);
    process.exit(1);
  }
}
