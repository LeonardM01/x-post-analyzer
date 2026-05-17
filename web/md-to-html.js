// WHY: escape first so user-supplied content (tweet text embedded in reports) cannot inject HTML
// even if the markdown renderer later wraps it in tags.

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyInline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(^|[^a-zA-Z0-9])_([^_\n]+)_(?=[^a-zA-Z0-9]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function parseTable(lines) {
  const rows = lines.filter((l) => !l.match(/^\|[-| :]+\|$/));
  let html = '<table>';
  rows.forEach((row, i) => {
    const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    const tag = i === 0 ? 'th' : 'td';
    html += '<tr>' + cells.map((c) => `<${tag}>${applyInline(c.trim())}</${tag}>`).join('') + '</tr>';
  });
  html += '</table>';
  return html;
}

export function mdToHtml(md) {
  const escaped = escapeHtml(md);
  const rawLines = escaped.split('\n');

  const out = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < rawLines.length && !rawLines[i].startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      out.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
      i++;
      continue;
    }

    const tableLines = [];
    if (line.startsWith('|')) {
      tableLines.push(line);
      while (i + 1 < rawLines.length && rawLines[i + 1].startsWith('|')) {
        i++;
        tableLines.push(rawLines[i]);
      }
      out.push(parseTable(tableLines));
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      out.push(`<h3>${applyInline(line.slice(4))}</h3>`);
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      out.push(`<h2>${applyInline(line.slice(3))}</h2>`);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      out.push(`<h1>${applyInline(line.slice(2))}</h1>`);
      i++;
      continue;
    }

    if (line.startsWith('&gt; ')) {
      out.push(`<blockquote>${applyInline(line.slice(5))}</blockquote>`);
      i++;
      continue;
    }

    if (line.match(/^---+$/)) {
      out.push('<hr>');
      i++;
      continue;
    }

    const ulLines = [];
    if (line.match(/^[-*] /)) {
      ulLines.push(line);
      while (i + 1 < rawLines.length && rawLines[i + 1].match(/^[-*] /)) {
        i++;
        ulLines.push(rawLines[i]);
      }
      const items = ulLines.map((l) => {
        const content = l.slice(2);
        if (content.startsWith('[ ] ')) {
          return `<li><input type="checkbox" disabled> ${applyInline(content.slice(4))}</li>`;
        }
        if (content.startsWith('[x] ') || content.startsWith('[X] ')) {
          return `<li><input type="checkbox" disabled checked> ${applyInline(content.slice(4))}</li>`;
        }
        return `<li>${applyInline(content)}</li>`;
      });
      out.push('<ul>' + items.join('') + '</ul>');
      i++;
      continue;
    }

    const olLines = [];
    if (line.match(/^\d+\. /)) {
      olLines.push(line);
      while (i + 1 < rawLines.length && rawLines[i + 1].match(/^\d+\. /)) {
        i++;
        olLines.push(rawLines[i]);
      }
      const items = olLines.map((l) => `<li>${applyInline(l.replace(/^\d+\. /, ''))}</li>`);
      out.push('<ol>' + items.join('') + '</ol>');
      i++;
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    out.push(`<p>${applyInline(line)}</p>`);
    i++;
  }

  return out.join('\n');
}
