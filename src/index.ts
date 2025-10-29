#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './init';
import { tsDoctorCommand } from './ts-doctor';
import { name, description, version } from '../package.json';

const program = new Command();

program
  .name(name)
  .description(description)
  .version(version);

program
  .command('init')
  .description('Initialize monorepo with optimized tsconfig')
  .action(() => initCommand());

program
  .command('ts-doctor')
  .description('Diagnose TypeScript LSP issues')
  .action(() => tsDoctorCommand());

program
  .command('dev')
  .description('Start app and dependencies (comming soon)')
  .argument('<app>', 'App package name')
  .action((app) =>
    devCommand(app)
  );

program
  .command('ci')
  .description('Run CI for affected packages (comming soon)')
  .option("--affected", "Only run for changed packages")
  .action((options) => ciCommand(options));

program.parse();
