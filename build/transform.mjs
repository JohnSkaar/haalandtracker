// Transforms the Claude Design-canvas markup (Main.dc.html) into a plain
// vanilla-JS render() function: {{a.b}} -> ${a.b}, <sc-if>/<sc-for> -> ternary/map,
// onClick="{{item.path}}" inside a loop -> data-bind="listPath.${idx}.path" resolved
// via delegated click handling against the latest renderVals() output.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2];
const OUT = process.argv[3];
const html = readFileSync(SRC, 'utf-8');

// ---- extract markup body (inside <div class="page"> ... before </x-dc>) ----
const bodyStart = html.indexOf('<div class="page">');
const scriptStart = html.indexOf('<script data-dc-script>');
if (bodyStart === -1 || scriptStart === -1) throw new Error('markers not found');
let markup = html.slice(bodyStart, scriptStart).trim();
// the </x-dc> closing tag sits inside this slice (script is a sibling, after </x-dc>) — drop it.
markup = markup.replace(/<\/x-dc>\s*$/, '').trim();

// ---- tokenize sc-if / sc-for tags ----
const tagRe = /<sc-(if|for)\b([^>]*)>|<\/sc-(if|for)>/g;

function parseAttrs(attrStr) {
  const attrs = {};
  const re = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(attrStr))) attrs[m[1]] = m[2];
  return attrs;
}

// Build a tree: array of nodes, each either {type:'text', value} or
// {type:'if', cond, children} or {type:'for', list, as, children}
function parse(str) {
  let pos = 0;
  const stack = [{ children: [] }];
  tagRe.lastIndex = 0;
  let m;
  while ((m = tagRe.exec(str))) {
    const [full, openKind, attrStr, closeKind] = m;
    const textBefore = str.slice(pos, m.index);
    if (textBefore) stack[stack.length - 1].children.push({ type: 'text', value: textBefore });
    pos = m.index + full.length;
    if (openKind) {
      const attrs = parseAttrs(attrStr);
      let node;
      if (openKind === 'if') {
        const cond = attrs.value.match(/^\{\{(.+)\}\}$/)[1];
        node = { type: 'if', cond, children: [] };
      } else {
        const list = attrs.list.match(/^\{\{(.+)\}\}$/)[1];
        node = { type: 'for', list, as: attrs.as, children: [] };
      }
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    } else {
      stack.pop();
    }
  }
  const rest = str.slice(pos);
  if (rest) stack[stack.length - 1].children.push({ type: 'text', value: rest });
  return stack[0].children;
}

// ---- generate JS template-literal source from the tree ----
// loopCtx: array of {as, path} innermost-last, path is a JS expression string
// producing the dotted/indexed path to the current loop item from the root vals.

// Resolve a dotted expr against loopCtx: if its head is a loop variable, leave
// bare (real JS closure var); otherwise prefix with `vals.` (root renderVals()).
function resolveExpr(expr, loopCtx) {
  const head = expr.split('.')[0];
  const ctx = [...loopCtx].reverse().find((c) => c.as === head);
  return ctx ? expr : 'vals.' + expr;
}

function genText(text, loopCtx) {
  // First handle onClick="{{expr}}" specially -> data-bind="...".
  text = text.replace(/onClick="\{\{\s*([\w.]+)\s*\}\}"/g, (m, expr) => {
    const parts = expr.split('.');
    const head = parts[0];
    const ctx = [...loopCtx].reverse().find((c) => c.as === head);
    if (ctx) {
      const rest = parts.slice(1).join('.');
      const pathExpr = rest ? `${ctx.path} + '.${rest}'` : ctx.path;
      return `data-bind="\${${pathExpr}}"`;
    }
    return `data-bind="${expr}"`;
  });
  // Then plain {{a.b.c}} -> ${vals.a.b.c} (or ${a.b.c} if `a` is a loop-scoped variable).
  text = text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, expr) => '${' + resolveExpr(expr, loopCtx) + '}');
  // Escape backticks and ${ that aren't ours (none expected) — backticks in source text (none expected, but be safe)
  text = text.replace(/`/g, '\\`');
  return text;
}

function gen(nodes, loopCtx, indexVarStack) {
  return nodes.map((n) => {
    if (n.type === 'text') return genText(n.value, loopCtx);
    if (n.type === 'if') {
      const cond = resolveExpr(n.cond, loopCtx);
      const inner = gen(n.children, loopCtx, indexVarStack);
      return '${(' + cond + ') ? `' + inner + '` : \'\'}';
    }
    if (n.type === 'for') {
      const idxVar = '__i' + indexVarStack.length;
      const list = resolveExpr(n.list, loopCtx);
      const newCtx = [...loopCtx, { as: n.as, path: `'${n.list}.' + ${idxVar}` }];
      const inner = gen(n.children, newCtx, [...indexVarStack, idxVar]);
      return '${(' + list + '||[]).map((' + n.as + ',' + idxVar + ') => `' + inner + '`).join(\'\')}';
    }
    return '';
  }).join('');
}

const tree = parse(markup);
const body = gen(tree, [], []);

// ---- extract the Component class body (state, methods, renderVals) ----
const scriptEnd = html.indexOf('</script>', scriptStart);
let compScript = html.slice(scriptStart + '<script data-dc-script>'.length, scriptEnd);
compScript = compScript.replace(/class Component extends DCLogic \{/, 'class Site {')
  .replace(/super\(props\);\s*/, '')
  .replace(/constructor\(props\)\s*\{/, 'constructor() {');

const out = `// AUTO-GENERATED by build/transform.mjs from a Claude Design-canvas source.
// Do not hand-edit the render() body; edit build/transform.mjs or the .dc.html source and re-run.
${compScript}

function render(vals) {
  return \`${body}\`;
}

export { Site, render };
`;

writeFileSync(OUT, out, 'utf-8');
console.log('wrote', OUT, out.length, 'chars');
