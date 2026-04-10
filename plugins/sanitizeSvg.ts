// SVG-only sanitizer: strips non-SVG elements and all event handler attributes.
// Used to prevent XSS from plugin-supplied icon strings.

const ALLOWED_TAGS = new Set([
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'ellipse', 'g', 'defs', 'use', 'text', 'tspan', 'clippath',
  'mask', 'lineargradient', 'radialgradient', 'stop', 'title', 'desc',
])

const EVENT_ATTR_RE = /^on/i

export function sanitizeSvg(raw: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, 'image/svg+xml')

  // If parsing failed, return empty
  const errorNode = doc.querySelector('parsererror')
  if (errorNode) return ''

  const svg = doc.documentElement
  if (svg.tagName.toLowerCase() !== 'svg') return ''

  sanitizeNode(svg)
  return new XMLSerializer().serializeToString(svg)
}

function sanitizeNode(el: Element): void {
  // Remove disallowed elements
  const children = Array.from(el.children)
  for (const child of children) {
    if (!ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
      child.remove()
    } else {
      // Remove event handler attributes
      const attrs = Array.from(child.attributes)
      for (const attr of attrs) {
        if (EVENT_ATTR_RE.test(attr.name) || attr.name === 'href' && !attr.value.startsWith('#')) {
          child.removeAttribute(attr.name)
        }
      }
      sanitizeNode(child)
    }
  }
}
