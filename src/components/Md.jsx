// Renders user-written long-form text as Markdown.
//
//  * remark-gfm    tables, ~~strike~~, task lists, bare-URL autolinks.
//  * remark-breaks a single newline is a line break, the way it looks in the textarea.
//  * noSetext      a line of dashes is ALWAYS a horizontal rule. In plain CommonMark,
//                  "text\n-----" turns the line above into a heading, which is never
//                  what a divider typed under a gloss means. "# heading" still works.
//
// Raw HTML is not rendered (react-markdown's default), and link URLs go through its
// default sanitiser, so stored text cannot inject markup or javascript: links.

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function noSetext() {
  const data = this.data();
  (data.micromarkExtensions ||= []).push({ disable: { null: ["setextUnderline"] } });
}

const PLUGINS = [noSetext, remarkGfm, remarkBreaks];

const COMPONENTS = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} />,
};

export function Md({ children, style, className = "" }) {
  const text = children == null ? "" : String(children);
  if (!text.trim()) return null;
  return (
    <div className={`md ${className}`.trim()} style={style}>
      <ReactMarkdown remarkPlugins={PLUGINS} components={COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

// Flattens Markdown to one line of readable plain text, for the truncated previews
// on cards and rows, where there is no room to render the real thing. Line by line,
// because the things that read worst when flattened — tables, rules, fences — are
// whole-line constructs: a table's cells become words, its ruler row disappears.
const FENCE = /^(```|~~~)/;
const RULE = /^([-*_])(\s*\1){2,}$/;
const TABLE_RULER = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;
const MARKER = /^(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/;

export function mdPlain(text = "") {
  const out = [];
  let inFence = false;

  for (const raw of String(text).split(/\r?\n/)) {
    let line = raw.trim();
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line || RULE.test(line) || TABLE_RULER.test(line)) continue;

    while (MARKER.test(line)) line = line.replace(MARKER, "");
    line = line.replace(/^\[[ xX]\]\s*/, ""); // task list box
    if (line.includes("|")) line = line.split("|").map((c) => c.trim()).filter(Boolean).join(" ");
    if (line) out.push(line);
  }

  return out
    .join(" ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|~~|`)/g, "")
    .replace(/(^|[\s(])[*_](\S[^*_]*?)[*_](?=[\s).,;:!?]|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

// mdPlain, cut to `max` characters on a word boundary.
export function mdPreview(text = "", max = 90) {
  const s = mdPlain(text);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:·—-]+$/, "") + "…";
}
