import { css } from "@codemirror/lang-css"
import { html } from "@codemirror/lang-html"
import { javascript } from "@codemirror/lang-javascript"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import type { Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { tags as t } from "@lezer/highlight"
import { getExtension } from "@/lib/core/file-kind"

/**
 * Colours come from CSS variables so the editor follows the light/dark theme
 * without re-creating extensions.
 */
const markdownHighlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.6em", fontWeight: "650", letterSpacing: "-0.02em", color: "var(--foreground)" },
  { tag: t.heading2, fontSize: "1.3em", fontWeight: "650", letterSpacing: "-0.015em", color: "var(--foreground)" },
  { tag: t.heading3, fontSize: "1.12em", fontWeight: "650", color: "var(--foreground)" },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: "650", color: "var(--foreground)" },
  { tag: t.strong, fontWeight: "650" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--muted-foreground)" },
  { tag: t.link, color: "var(--brand)" },
  { tag: t.url, color: "var(--subtle-foreground)", textDecoration: "underline" },
  { tag: t.quote, color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: t.monospace, fontFamily: "var(--font-mono)", fontSize: "0.88em", color: "var(--code-string)" },
  { tag: [t.processingInstruction, t.meta, t.contentSeparator], color: "var(--subtle-foreground)" },
  { tag: t.list, color: "var(--foreground)" },
  // Fenced code inside markdown
  { tag: t.keyword, color: "var(--code-keyword)" },
  { tag: [t.string, t.special(t.string)], color: "var(--code-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--code-number)" },
  { tag: t.comment, color: "var(--code-comment)", fontStyle: "italic" },
])

const codeHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.operatorKeyword, t.controlKeyword], color: "var(--code-keyword)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--code-string)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--code-number)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.typeName, t.className, t.tagName], color: "var(--code-title)" },
  { tag: [t.propertyName, t.attributeName], color: "var(--foreground)" },
  { tag: [t.definition(t.variableName)], color: "var(--foreground)" },
  { tag: [t.punctuation, t.bracket, t.operator], color: "var(--muted-foreground)" },
  { tag: t.heading, fontWeight: "650" },
])

const languageFor = (fileName: string): Extension | null => {
  const extension = getExtension(fileName)
  switch (extension) {
    case "js":
    case "mjs":
    case "cjs":
    case "json":
      return javascript()
    case "jsx":
      return javascript({ jsx: true })
    case "ts":
      return javascript({ typescript: true })
    case "tsx":
      return javascript({ typescript: true, jsx: true })
    case "css":
    case "scss":
      return css()
    case "html":
    case "xml":
    case "svg":
      return html()
    default:
      return null
  }
}

export const buildExtensions = (fileName: string, isMarkdown: boolean): Extension[] => {
  if (isMarkdown) {
    return [
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(markdownHighlight),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ spellcheck: "true", autocorrect: "on" }),
    ]
  }

  const language = languageFor(fileName)
  return [...(language ? [language] : []), syntaxHighlighting(codeHighlight)]
}
