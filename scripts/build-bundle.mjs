#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const push = process.argv.includes('--push');
const repoRoot = run('git', ['rev-parse', '--show-toplevel'], { capture: true }).stdout.trim();
const bundleDir = path.join(repoRoot, 'bundle');
const frontendDir = path.join(repoRoot, 'frontend');

function executable(name) {
  return process.platform === 'win32' && ['npm', 'npx'].includes(name) ? `${name}.cmd` : name;
}

function run(command, args, options = {}) {
  const result = spawnSync(executable(command), args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    shell: false,
    stdio: options.capture ? 'pipe' : 'inherit'
  });

  if (result.status !== 0 && !options.allowFailure) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}${output ? `\n${output}` : ''}`);
  }

  return result;
}

function hasStagedDiff(cwd) {
  const result = run('git', ['diff', '--cached', '--quiet'], { cwd, allowFailure: true, capture: true });
  if (result.status === 0) {
    return false;
  }

  if (result.status === 1) {
    return true;
  }

  throw new Error(`git diff --cached --quiet failed in ${cwd}`);
}

function commitIfStaged(cwd, message, label) {
  if (!hasStagedDiff(cwd)) {
    console.log(`${label}: nothing to commit`);
    return false;
  }

  run('git', ['commit', '-m', message], { cwd });
  return true;
}

async function emptyDirectoryExceptGit(directory) {
  await mkdir(directory, { recursive: true });
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(entries
    .filter((entry) => entry.name !== '.git')
    .map((entry) => rm(path.join(directory, entry.name), { recursive: true, force: true })));
}

async function copyAsIs(from, to) {
  await mkdir(path.dirname(to), { recursive: true });
  await writeFile(to, await readFile(from));
}

async function assembleBundle() {
  const outputDir = path.join(frontendDir, 'dist', 'snip-frontend', 'browser');
  const indexPath = path.join(outputDir, 'index.html');

  if (!existsSync(indexPath)) {
    throw new Error(`Frontend build is missing ${indexPath}`);
  }

  await emptyDirectoryExceptGit(bundleDir);
  await copyAsIs(path.join(repoRoot, 'backend', 'server.js'), path.join(bundleDir, 'server.js'));
  await copyAsIs(path.join(repoRoot, 'cli', 'cli.js'), path.join(bundleDir, 'cli.js'));
  await cp(outputDir, path.join(bundleDir, 'public'), { recursive: true });

  await writeFile(path.join(bundleDir, '.env'), 'PUBLIC_DIR=./public\n');
  await writeFile(path.join(bundleDir, 'package.json'), `${JSON.stringify({
    name: 'snip-bundle',
    version: '0.1.0',
    private: true,
    scripts: {
      start: 'bun server.js'
    }
  }, null, 2)}\n`);
  await writeFile(path.join(bundleDir, 'Dockerfile'), [
    'FROM oven/bun:1-alpine',
    'COPY . .',
    'ENV PORT=3000',
    'EXPOSE 3000',
    'CMD bun server.js',
    ''
  ].join('\n'));
  await writeFile(path.join(bundleDir, '.dockerignore'), [
    '.git',
    'node_modules',
    'npm-debug.log',
    ''
  ].join('\n'));
  await writeFile(path.join(bundleDir, 'railway.json'), `${JSON.stringify({
    build: {
      builder: 'DOCKERFILE'
    }
  }, null, 2)}\n`);
}

console.log('Updating source submodules...');
run('git', ['submodule', 'update', '--init', '--remote', 'backend', 'frontend', 'cli']);

console.log('Installing frontend dependencies...');
run('npm', ['install'], { cwd: frontendDir });

console.log('Building frontend...');
run('npx', ['ng', 'build'], { cwd: frontendDir });

console.log('Assembling bundle submodule...');
await assembleBundle();

run('git', ['add', '-A'], { cwd: bundleDir });
const bundleCommitted = commitIfStaged(bundleDir, 'Update generated bundle', 'bundle');

if (push) {
  console.log('Pushing bundle branch...');
  run('git', ['push', 'origin', 'HEAD:bundle'], { cwd: bundleDir });
} else if (bundleCommitted) {
  console.log('bundle: committed locally; rerun with --push to publish HEAD:bundle');
}

run('git', ['add', 'backend', 'frontend', 'cli', 'bundle']);
const mainCommitted = commitIfStaged(repoRoot, 'Bump generated bundle pointers', 'main');

if (push) {
  console.log('Pushing main branch...');
  run('git', ['push', 'origin', 'HEAD:main']);
} else if (mainCommitted) {
  console.log('main: committed locally; rerun with --push to publish main');
}
