import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import { toText } from 'hast-util-to-text'
import katex from 'katex'
import { SKIP, visitParents } from 'unist-util-visit-parents'
import type { ElementContent, Root } from 'hast'
import type { KatexOptions } from 'katex'
import type { VFile } from 'vfile'
import type { AsciiMathConfig } from 'asciimath-parser'
import { AsciiMath } from 'asciimath-parser'

type Options = Omit<KatexOptions, 'displayMode' | 'throwOnError'> & {
  amConfig?: AsciiMathConfig
  amEnabled: boolean
}

const emptyOptions: Readonly<Options> = {
  amEnabled: true,
}
const emptyClasses: ReadonlyArray<unknown> = []

function isLatexCode(code: string): boolean {
  const latexRegex = /\\([A-Za-z0-9]){2,}/gm
  const texEmbedRegex = /tex".*"/

  return latexRegex.test(code) && !texEmbedRegex.test(code)
}

/**
 * Render elements with a `language-math` (or `math-display`, `math-inline`)
 * class with KaTeX.
 */
export default function rehypeKatex(options?: Readonly<Options> | null) {
  const settings = Object.assign(emptyOptions, options)
  const am = settings.amEnabled ? new AsciiMath(settings.amConfig) : undefined

  return function (tree: Root, file: VFile) {
    visitParents(tree, 'element', function (element, parents) {
      const classes = Array.isArray(element.properties.className)
        ? element.properties.className
        : emptyClasses
      // This class can be generated from markdown with ` ```math `.
      const languageMath = classes.includes('language-math')
      // This class is used by `remark-math` for flow math (block, `$$\nmath\n$$`).
      const mathDisplay = classes.includes('math-display')
      // This class is used by `remark-math` for text math (inline, `$math$`).
      const mathInline = classes.includes('math-inline')
      let displayMode = mathDisplay

      // Any class is fine.
      if (!languageMath && !mathDisplay && !mathInline) {
        return
      }

      let parent = parents[parents.length - 1]
      let scope = element

      // If this was generated with ` ```math `, replace the `<pre>` and use
      // display.
      if (
        element.tagName === 'code' &&
        languageMath &&
        parent &&
        parent.type === 'element' &&
        parent.tagName === 'pre'
      ) {
        scope = parent
        parent = parents[parents.length - 2]
        displayMode = true
      }

      /* c8 ignore next -- verbose to test. */
      if (!parent) return

      let value = toText(scope, { whitespace: 'pre' })

      if (settings.amEnabled)
        if (!isLatexCode(value))
          value = am!.toTex(value)

      let result: string | Array<ElementContent> | undefined

      try {
        result = katex.renderToString(value, {
          ...settings,
          displayMode,
          throwOnError: true
        })
      } catch (error) {
        const cause = error as Error
        const ruleId = cause.name.toLowerCase()

        file.message('Could not render math with KaTeX', {
          ancestors: [...parents, element],
          cause,
          place: element.position,
          ruleId,
          source: 'rehype-katex'
        })

        // KaTeX can handle `ParseError` itself, but not others.
        if (ruleId === 'parseerror') {
          result = katex.renderToString(value, {
            ...settings,
            displayMode,
            strict: 'ignore',
            throwOnError: false
          })
        }
        // Generate similar markup if this is an other error.
        // See: <https://github.com/KaTeX/KaTeX/blob/5dc7af0/docs/error.md>.
        else {
          result = [
            {
              type: 'element',
              tagName: 'span',
              properties: {
                className: ['katex-error'],
                style: 'color:' + (settings.errorColor || '#cc0000'),
                title: String(error)
              },
              children: [{ type: 'text', value }]
            }
          ]
        }
      }

      if (typeof result === 'string') {
        const root = fromHtmlIsomorphic(result, { fragment: true })
        // Cast as we don’t expect `doctypes` in KaTeX result.
        result = root.children as Array<ElementContent>
      }

      const index = parent.children.indexOf(scope)
      parent.children.splice(index, 1, ...result)
      return SKIP
    })
  }
}