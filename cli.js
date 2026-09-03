#!/usr/bin/env node

'use strict';

const { spawn } = require('node:child_process');

const DEFAULT_API = 'http://localhost:3000';
const baseUrl = (process.env.SNIP_API || DEFAULT_API).replace(/\/+$/, '');

function usage() {
  return [
    'Usage:',
    '  snip add <url>    Create a short link and print the short URL',
    '  snip ls           List links as a code/hits/url table',
    '  snip open <code>  Open a short code in the OS browser',
    '  snip help         Show this help',
    '',
    `SNIP_API defaults to ${DEFAULT_API}`
  ].join('\n');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatBackendError(error) {
  if (error && typeof error.error === 'string') {
    return error.error;
  }

  return null;
}

async function readError(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return formatBackendError(JSON.parse(text)) || text;
  } catch {
    return text;
  }
}

async function request(path, options) {
  try {
    return await fetch(`${baseUrl}${path}`, options);
  } catch (error) {
    const reason = error && error.message ? ` ${error.message}` : '';
    fail(`Could not reach the Snip API at ${baseUrl}.${reason}`);
  }
}

async function add(args) {
  const url = args[0];
  if (!url || args.length !== 1) {
    fail('Usage: snip add <url>');
  }

  if (!isHttpUrl(url)) {
    fail('Enter a valid URL that starts with http:// or https://.');
  }

  const response = await request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    fail(await readError(response) || `Snip API returned ${response.status} ${response.statusText}`);
  }

  const link = await response.json();
  if (!link || typeof link.shortUrl !== 'string') {
    fail('Snip API returned an unexpected response.');
  }

  console.log(link.shortUrl);
}

async function list(args) {
  if (args.length !== 0) {
    fail('Usage: snip ls');
  }

  const response = await request('/api/links');
  if (!response.ok) {
    fail(await readError(response) || `Snip API returned ${response.status} ${response.statusText}`);
  }

  const links = await response.json();
  if (!Array.isArray(links)) {
    fail('Snip API returned an unexpected response.');
  }

  if (links.length === 0) {
    console.log('No links yet.');
    return;
  }

  const rows = links.map((link) => ({
    code: String(link.code || ''),
    hits: String(link.hits ?? ''),
    url: String(link.url || '')
  }));

  const codeWidth = Math.max('CODE'.length, ...rows.map((row) => row.code.length));
  const hitsWidth = Math.max('HITS'.length, ...rows.map((row) => row.hits.length));

  console.log(`${'CODE'.padEnd(codeWidth)}  ${'HITS'.padStart(hitsWidth)}  URL`);
  for (const row of rows) {
    console.log(`${row.code.padEnd(codeWidth)}  ${row.hits.padStart(hitsWidth)}  ${row.url}`);
  }
}

function openInBrowser(target) {
  const platform = process.platform;
  const command = platform === 'win32'
    ? (process.env.ComSpec || 'cmd.exe')
    : platform === 'darwin'
      ? 'open'
      : 'xdg-open';
  const args = platform === 'win32'
    ? ['/c', 'start', '', target]
    : [target];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });

  child.on('error', (error) => {
    fail(`Could not open browser: ${error.message}`);
  });

  child.unref();
}

async function openCode(args) {
  const code = args[0];
  if (!code || args.length !== 1) {
    fail('Usage: snip open <code>');
  }

  const response = await request(`/${encodeURIComponent(code)}`, { redirect: 'manual' });
  const location = response.headers.get('location');

  if (response.status >= 300 && response.status < 400 && location) {
    openInBrowser(location);
    return;
  }

  if (response.status === 404) {
    fail(`Unknown short code: ${code}`);
  }

  fail(await readError(response) || `Snip API returned ${response.status} ${response.statusText}`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(usage());
    return;
  }

  if (command === 'add') {
    await add(args);
    return;
  }

  if (command === 'ls') {
    await list(args);
    return;
  }

  if (command === 'open') {
    await openCode(args);
    return;
  }

  fail(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
