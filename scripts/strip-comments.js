

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set(['node_modules', '.next', 'out', 'build', '.vercel', 'public']);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const CSS_EXTS = new Set(['.css', '.scss']);
const SQL_EXTS = new Set(['.sql']);

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry');

function isEnvFile(filePath) {
  const base = path.basename(filePath);
  return base === '.env' || base.startsWith('.env.');
}

function isExcluded(fullPath) {
  
  const parts = fullPath.split(path.sep);
  return parts.some((p) => EXCLUDED_DIRS.has(p));
}

function getAllFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!isExcluded(fullPath)) {
        files.push(...getAllFiles(fullPath));
      }
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function shouldPreserveComment(text, filePath) {
  
  
  if (/\/\/\s*@ts-(ignore|expect-error|nocheck|check)/.test(text)) return true;
  
  if (/@(jsx|jsxImportSource)\b/.test(text)) return true; 
  if (/^\/\*\*/.test(text) && /@(type|typedef|param|returns)\b/.test(text)) return true;
  return false;
}

function stripCommentsTS(code, filePath) {
  const isJSX = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
     false,
    isJSX ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    code
  );

  function needsSpace(prevChar, nextText) {
    if (!prevChar || !nextText) return false;
    const nextFirst = nextText[0];
    const prevIsIdent = /[A-Za-z0-9_$]/.test(prevChar);
    const nextIsIdent = /[A-Za-z_$]/.test(nextFirst);
    return prevIsIdent && nextIsIdent;
  }

  let out = '';
  let pending = null; 

  function getNext() {
    if (pending) {
      const t = pending;
      pending = null;
      return t;
    }
    const kind = scanner.scan();
    return { kind, text: scanner.getTokenText() };
  }

  let cur = getNext();
  while (cur.kind !== ts.SyntaxKind.EndOfFileToken) {
    const kind = cur.kind;
    const text = cur.text;

    if (kind === ts.SyntaxKind.SingleLineCommentTrivia || kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      if (shouldPreserveComment(text, filePath)) {
        out += text;
      } else {
        
        const prevChar = out.slice(-1);
        const nextTok = getNext();
        if (nextTok.kind !== ts.SyntaxKind.EndOfFileToken) {
          if (needsSpace(prevChar, nextTok.text)) out += ' ';
          
          pending = nextTok;
        }
      }
    } else {
      out += text;
    }

    cur = getNext();
  }

  return out;
}

function stripCommentsCSS(input) {
  let i = 0;
  let out = '';
  let inBlock = false;
  let inSingle = false;
  let inDouble = false;
  while (i < input.length) {
    const c = input[i];
    const n = input[i + 1];

    if (!inBlock && !inSingle && !inDouble && c === '/' && n === '*') {
      
      inBlock = true;
      i += 2;
      
      while (i < input.length) {
        if (input[i] === '*' && input[i + 1] === '/') {
          i += 2;
          inBlock = false;
          break;
        }
        i++;
      }
      continue;
    }

    if (!inBlock) {
      if (!inDouble && c === '\'' && input[i - 1] !== '\\') inSingle = !inSingle;
      if (!inSingle && c === '"' && input[i - 1] !== '\\') inDouble = !inDouble;
      out += c;
      i++;
      continue;
    }

    
  }
  return out;
}

function stripCommentsSQL(input) {
  let i = 0;
  let out = '';
  let inBlock = false;
  let inLine = false;
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;
  let dollarTag = '';

  function startsWithDollarTag(pos) {
    if (input[pos] !== '$') return null;
    let j = pos + 1;
    while (j < input.length && /[A-Za-z0-9_]/.test(input[j])) j++;
    if (j < input.length && input[j] === '$') return input.slice(pos, j + 1); 
    return '$$'; 
  }

  while (i < input.length) {
    const c = input[i];
    const n = input[i + 1];

    if (!inSingle && !inDouble && !inDollar && !inBlock && !inLine && c === '-' && n === '-') {
      
      inLine = true;
      
      i += 2;
      while (i < input.length && input[i] !== '\n') i++;
      continue;
    }

    if (!inSingle && !inDouble && !inDollar && !inBlock && c === '/' && n === '*') {
      
      inBlock = true;
      i += 2;
      while (i < input.length) {
        if (input[i] === '*' && input[i + 1] === '/') { i += 2; inBlock = false; break; }
        i++;
      }
      continue;
    }

    if (!inDouble && !inDollar && c === '\'' && input[i - 1] !== '\\') { inSingle = !inSingle; out += c; i++; continue; }
    if (!inSingle && !inDollar && c === '"' && input[i - 1] !== '\\') { inDouble = !inDouble; out += c; i++; continue; }

    if (!inSingle && !inDouble && !inDollar && c === '$') {
      const tag = startsWithDollarTag(i);
      if (tag) { inDollar = true; dollarTag = tag; out += tag; i += tag.length; continue; }
    }

    if (inDollar && input.slice(i, i + dollarTag.length) === dollarTag) {
      inDollar = false; out += dollarTag; i += dollarTag.length; continue;
    }

    if (!inBlock && !inLine) { out += c; }
    if (c === '\n') inLine = false;
    i++;
  }
  return out;
}

function stripCommentsEnv(input) {
  const lines = input.split(/\r?\n/);
  const outLines = [];
  for (let line of lines) {
    let inSingle = false, inDouble = false;
    let idx = -1;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const prev = line[i - 1];
      if (!inDouble && c === '\'' && prev !== '\\') inSingle = !inSingle;
      else if (!inSingle && c === '"' && prev !== '\\') inDouble = !inDouble;
      else if (!inSingle && !inDouble && c === '#') { idx = i; break; }
    }
    if (idx >= 0) line = line.slice(0, idx).trimEnd();
    
    outLines.push(line);
  }
  return outLines.join('\n');
}

function processFile(file) {
  const ext = path.extname(file);
  const isEnv = isEnvFile(file);
  if (!CODE_EXTS.has(ext) && !CSS_EXTS.has(ext) && !SQL_EXTS.has(ext) && !isEnv) return null;

  const original = fs.readFileSync(file, 'utf8');
  let updated = original;

  try {
    if (CODE_EXTS.has(ext)) {
      updated = stripCommentsTS(original, file);
    } else if (CSS_EXTS.has(ext)) {
      updated = stripCommentsCSS(original);
    } else if (SQL_EXTS.has(ext)) {
      updated = stripCommentsSQL(original);
    } else if (isEnv) {
      updated = stripCommentsEnv(original);
    }
  } catch (e) {
    
    return null;
  }

  if (updated !== original) {
    return { original, updated };
  }
  return null;
}

function main() {
  const all = getAllFiles(ROOT);
  let changed = 0;
  let totalBytesRemoved = 0;
  const samples = [];

  for (const file of all) {
    if (isExcluded(file)) continue;
    const res = processFile(file);
    if (res) {
      changed++;
      const removed = res.original.length - res.updated.length;
      totalBytesRemoved += removed > 0 ? removed : 0;
      if (!DRY_RUN) {
        fs.writeFileSync(file, res.updated, 'utf8');
      } else if (samples.length < 10) {
        const beforeSnippet = res.original.slice(0, 300);
        const afterSnippet = res.updated.slice(0, 300);
        samples.push({ file, removed, beforeSnippet, afterSnippet });
      }
    }
  }

  const summary = {
    dryRun: DRY_RUN,
    filesChanged: changed,
    approxBytesRemoved: totalBytesRemoved,
    sample: samples,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main();
