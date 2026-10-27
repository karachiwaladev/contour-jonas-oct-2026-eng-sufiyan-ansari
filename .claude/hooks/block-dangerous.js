#!/usr/bin/env node
// PreToolUse guard: blocks recursive force deletes, force pushes, piping a download
// into a shell, and reading .env files. Mirrors permissions.deny in ../settings.json,
// but matches anywhere in a command (after &&, ;, |, extra flags) where prefix rules can't.
// Input: hook JSON on stdin. Output: a deny decision on stdout, or nothing to allow.

// A .env file: ".env" or ".env.<anything>", as a whole path segment.
const ENV_FILE = /(^|[\\/\s'"=<(])\.env(\.[\w.-]+)?(?=$|[\s'";|&)>])/i;
const ENV_READERS =
  /\b(cat|less|more|head|tail|type|bat|nl|strings|grep|egrep|rg|sed|awk|cut|sort|source|xxd|od|base64|cp|scp|gc|get-content|select-string|import-csv)\b/i;

function checkCommand(cmd) {
  // Split into simple commands so a flag in one doesn't pair with a verb in another.
  for (const part of cmd.split(/&&|\|\||;|\n/)) {
    const rm = part.match(/(^|[\s(])(sudo\s+)?rm\s+([^|]*)/);
    if (rm) {
      const args = ` ${rm[3]}`;
      const recursive = /\s-([a-zA-Z]*[rR][a-zA-Z]*)\b|\s--recursive\b/.test(args);
      const force = /\s-([a-zA-Z]*f[a-zA-Z]*)\b|\s--force\b/.test(args);
      if (recursive && force) return 'rm with recursive + force flags';
    }
    if (/\bremove-item\b/i.test(part) && /\s-recurse\b/i.test(part) && /\s-force\b/i.test(part)) {
      return 'Remove-Item -Recurse -Force';
    }
    const push = part.match(/\bgit\b.*?\bpush\b(.*)/);
    if (push && /\s(--force(-with-lease|-if-includes)?\b|-[a-zA-Z]*f[a-zA-Z]*\b|\+\S)/.test(push[1])) {
      return 'git push --force';
    }
  }
  if (/\b(curl|wget|irm|iwr|invoke-webrequest|invoke-restmethod)\b[^;&\n]*\|\s*(sudo\s+)?(ba|z|da|k|fi)?sh\b/i.test(cmd) ||
      /\b(curl|wget|irm|iwr|invoke-webrequest|invoke-restmethod)\b[^;&\n]*\|\s*(iex|invoke-expression|python3?|node|perl|ruby)\b/i.test(cmd) ||
      /\b(ba|z)?sh\b[^;&\n]*(<\(|\$\(|`)\s*(curl|wget)\b/.test(cmd)) {
    return 'piping a download into a shell (curl | sh)';
  }
  if (ENV_FILE.test(cmd) && ENV_READERS.test(cmd)) return 'reading a .env file';
  return null;
}

// Returns a reason string to block, or null to allow.
function check(input) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  if (tool === 'Bash' || tool === 'PowerShell') return checkCommand(String(ti.command || ''));
  if (tool === 'Read' || tool === 'Grep' || tool === 'NotebookRead') {
    const path = String(ti.file_path || ti.path || '');
    if (ENV_FILE.test(path)) return 'reading a .env file';
  }
  return null;
}

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    let input;
    try {
      input = JSON.parse(raw || '{}');
    } catch {
      return; // not our business to break the session on bad input
    }
    const reason = check(input);
    if (!reason) return;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Blocked by factory guard (.claude/hooks/block-dangerous.js): ${reason}.`,
      },
    }));
  });
}

module.exports = { check, checkCommand };
