/** Мини-библиотека для генерации чертёжных SVG (работает и в браузере, и в Node). */

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONT = "'Inter', 'Segoe UI', Arial, sans-serif"
export const INK = '#191714'
export const DIM = '#6d6a63'
export const ACCENT = '#a9693a'

export function txt(x, y, s, o = {}) {
  const {
    size = 13,
    anchor = 'start',
    weight = 400,
    fill = INK,
    rotate = 0,
    family = FONT,
    opacity = 1,
    letter = 0,
  } = o
  const tr = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : ''
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" letter-spacing="${letter}"${tr}>${esc(s)}</text>`
}

export function line(x1, y1, x2, y2, o = {}) {
  const { stroke = INK, w = 1, dash = '', opacity = 1, cap = 'butt' } = o
  const d = dash ? ` stroke-dasharray="${dash}"` : ''
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"${d} opacity="${opacity}"/>`
}

export function rect(x, y, w, h, o = {}) {
  const { fill = 'none', stroke = INK, sw = 1, dash = '', rx = 0, opacity = 1 } = o
  const d = dash ? ` stroke-dasharray="${dash}"` : ''
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${d} rx="${rx}" opacity="${opacity}"/>`
}

export function poly(points, o = {}) {
  const { fill = 'none', stroke = INK, sw = 1, opacity = 1, dash = '' } = o
  const d = dash ? ` stroke-dasharray="${dash}"` : ''
  const pts = points.map(([x, y]) => `${x},${y}`).join(' ')
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${d}/>`
}

export function path(d, o = {}) {
  const { fill = 'none', stroke = INK, sw = 1, dash = '', opacity = 1 } = o
  const da = dash ? ` stroke-dasharray="${dash}"` : ''
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${da} opacity="${opacity}"/>`
}

export function circle(cx, cy, r, o = {}) {
  const { fill = 'none', stroke = INK, sw = 1 } = o
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
}

/** размерная линия по горизонтали (числа в метрах) */
export function dimH(x1, x2, y, text, o = {}) {
  const { size = 11, color = DIM, off = 4 } = o
  const tick = 4
  return (
    line(x1, y - tick, x1, y + tick, { stroke: color, w: 1 }) +
    line(x2, y - tick, x2, y + tick, { stroke: color, w: 1 }) +
    line(x1, y, x2, y, { stroke: color, w: 1 }) +
    `<rect x="${(x1 + x2) / 2 - (String(text).length * size * 0.31 + 4)}" y="${y - size * 0.75 - off}" width="${String(text).length * size * 0.62 + 8}" height="${size * 1.35}" fill="#ffffff"/>` +
    txt((x1 + x2) / 2, y - off, text, { size, anchor: 'middle', fill: color })
  )
}

/** размерная линия по вертикали */
export function dimV(y1, y2, x, text, o = {}) {
  const { size = 11, color = DIM, off = 4 } = o
  const tick = 4
  const cy = (y1 + y2) / 2
  const w = String(text).length * size * 0.62 + 8
  return (
    line(x - tick, y1, x + tick, y1, { stroke: color, w: 1 }) +
    line(x - tick, y2, x + tick, y2, { stroke: color, w: 1 }) +
    line(x, y1, x, y2, { stroke: color, w: 1 }) +
    `<rect x="${x - size * 1.05 - off}" y="${cy - w / 2}" width="${size * 1.4}" height="${w}" fill="#ffffff" transform="rotate(-90 ${x - off} ${cy})"/>` +
    txt(x - off, cy, text, { size, anchor: 'middle', fill: color, rotate: -90 })
  )
}

export function axisMark(x, y, label, r = 11) {
  return (
    circle(x, y, r, { fill: '#fff', stroke: INK, sw: 1 }) +
    txt(x, y + 4.5, label, { size: 12, anchor: 'middle', weight: 600 })
  )
}

/** выноска с номером узла */
export function callout(x, y, n, tx, ty) {
  return (
    line(x, y, tx, ty, { stroke: ACCENT, w: 1.2 }) +
    circle(tx, ty, 10, { fill: '#fff', stroke: ACCENT, sw: 1.4 }) +
    txt(tx, ty + 4, String(n), { size: 11, anchor: 'middle', weight: 700, fill: ACCENT })
  )
}

export const defs = () => `
<defs>
  <pattern id="wood" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="8" stroke="#c9a074" stroke-width="2"/>
  </pattern>
  <pattern id="woodH" width="8" height="8" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="8" stroke="#c9a074" stroke-width="2"/>
  </pattern>
  <pattern id="insul" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="10" height="10" fill="#f6e2b3"/>
    <path d="M0 5 Q 2.5 0 5 5 T 10 5" fill="none" stroke="#d9b264" stroke-width="1"/>
  </pattern>
  <pattern id="soil" width="9" height="9" patternUnits="userSpaceOnUse">
    <line x1="0" y1="9" x2="9" y2="0" stroke="#b6b0a4" stroke-width="1"/>
  </pattern>
  <pattern id="concrete" width="7" height="7" patternUnits="userSpaceOnUse">
    <circle cx="2" cy="2" r="0.7" fill="#b3ada2"/>
    <circle cx="5.5" cy="5" r="0.6" fill="#b3adb2"/>
  </pattern>
  <pattern id="tile" width="12" height="12" patternUnits="userSpaceOnUse">
    <rect width="12" height="12" fill="#f2f0ec"/>
    <line x1="0" y1="0" x2="12" y2="0" stroke="#cfcac1" stroke-width="0.8"/>
    <line x1="0" y1="0" x2="0" y2="12" stroke="#cfcac1" stroke-width="0.8"/>
  </pattern>
</defs>`

/** лист с рамкой и штампом */
function wrapText(text, maxChars) {
  const words = String(text).split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim())
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  return lines
}

export function sheet({ w = 1240, h = 877, title, subtitle, scale, body, note, num, of }) {
  const m = 18
  const tbW = 430
  const tbH = 82
  const tbX = w - m - tbW
  const tbY = h - m - tbH
  const col2 = tbX + 232
  const subLines = wrapText(subtitle || 'Каркасная технология, винтовые сваи', 44).slice(0, 2)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
${defs()}
<rect width="${w}" height="${h}" fill="#fdfcf9"/>
<rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" fill="none" stroke="${INK}" stroke-width="1.6"/>
${body}
${note ? wrapText(note, 100).slice(0, 2).map((l, i) => txt(m + 18, h - m - 20 + i * 13, l, { size: 9, fill: '#7a766d' })).join('') : ''}
<rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" fill="#fff" stroke="${INK}" stroke-width="1.2"/>
${line(tbX, tbY + 24, tbX + tbW, tbY + 24, { stroke: INK, w: 1 })}
${line(col2, tbY + 24, col2, tbY + tbH, { stroke: INK, w: 1 })}
${line(tbX, tbY + 52, tbX + tbW, tbY + 52, { stroke: INK, w: 1 })}
${txt(tbX + 12, tbY + 17, 'БАРНХАУС «МАРГО» 10,0 × 9,5 + терраса', { size: 11.5, weight: 700 })}
${txt(tbX + 12, tbY + 42, title, { size: 11, weight: 600 })}
${txt(tbX + 12, tbY + 66, subLines[0] || '', { size: 8.5, fill: DIM })}
${txt(tbX + 12, tbY + 77, subLines[1] || '', { size: 8.5, fill: DIM })}
${txt(col2 + 14, tbY + 42, scale || '1:50', { size: 12, weight: 600 })}
${txt(col2 + 14, tbY + 66, num ? `Лист ${num} из ${of || 7}` : 'Лист 1 из 1', { size: 8.5, fill: DIM })}
${txt(col2 + 14, tbY + 77, 'Версия 1.0 · 11.2026', { size: 8.5, fill: DIM })}
</svg>`
}
