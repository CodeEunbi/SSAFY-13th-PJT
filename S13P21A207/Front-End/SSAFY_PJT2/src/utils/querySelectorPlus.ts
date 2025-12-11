// src/utils/querySelectorPlus.ts
export function buildSelector(el: Element): string {
  if (!el || el === document.body) return "body";
  const id = (el as HTMLElement).id;
  if (id) return `#${CSS.escape(id)}`;

  const parts: string[] = [];
  let curr: Element | null = el;
  while (curr && curr !== document.body) {
    const cid = (curr as HTMLElement).id;
    if (cid) { parts.unshift(`#${CSS.escape(cid)}`); break; }
    let part = curr.tagName.toLowerCase();
    const cls = ((curr as HTMLElement).className || "")
      .toString().trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) part += "." + cls.map(c => CSS.escape(c)).join(".");
    parts.unshift(part);
    curr = curr.parentElement;
  }
  return parts.join(">");
}
