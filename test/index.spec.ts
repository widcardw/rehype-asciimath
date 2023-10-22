import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import rehypeKatex from '../src'
import katex from 'katex'

describe('transform katex', () => {
  it('transform simple symbol', async () => {
    expect(
      String(
        await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(
            [
              '<p>Inline math <span class="math-inline">\\alpha</span>.</p>',
              '<p>Block math:</p>',
              '<div class="math-display">\\gamma</div>'
            ].join('\n')
          )
      )
    ).eq(
      String(
        await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeStringify)
          .process(
            [
              '<p>Inline math ' + katex.renderToString('\\alpha') + '.</p>',
              '<p>Block math:</p>',
              katex.renderToString('\\gamma', { displayMode: true })
            ].join('\n')
          )
      )
    )
  })

  it('should integrate with `remark-math`', async function () {
    expect(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkMath)
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(
            [
              'Inline math $\\alpha$.',
              '',
              'Block math:',
              '',
              '$$',
              '\\gamma',
              '$$'
            ].join('\n')
          )
      )
    ).eq(
      String(
        await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeStringify)
          .process(
            [
              '<p>Inline math ' + katex.renderToString('\\alpha') + '.</p>',
              '<p>Block math:</p>',
              katex.renderToString('\\gamma', { displayMode: true })
            ].join('\n')
          )
      )
    )
  })

  it('should support comments', async function () {
    expect(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(
            '<div class="math-display">\\begin{split}\n  f(-2) &= \\sqrt{-2+4} \\\\\n  &= x % Test Comment\n\\end{split}</div>'
          )
      )
    ).eq(
      String(
        await unified()
          .use(rehypeParse, {fragment: true})
          .use(rehypeStringify)
          .process(
            katex.renderToString(
              '\\begin{split}\n  f(-2) &= \\sqrt{-2+4} \\\\\n  &= x % Test Comment\n\\end{split}',
              {displayMode: true}
            )
          )
      )
    )
  })
})

describe('transform asciimath', () => {
  it('transform simple symbol', async () => {
    expect(
      String(
        await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(
            [
              '<p>Inline math <span class="math-inline">alpha</span>.</p>',
              '<p>Block math:</p>',
              '<div class="math-display">gamma</div>'
            ].join('\n')
          )
      )
    ).eq(
      String(
        await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeStringify)
          .process(
            [
              '<p>Inline math ' + katex.renderToString('\\displaystyle{ \\alpha }') + '.</p>',
              '<p>Block math:</p>',
              katex.renderToString('\\displaystyle{ \\gamma }', { displayMode: true })
            ].join('\n')
          )
      )
    )
  })

  it('should integrate with `remark-math`', async function () {
    expect(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkMath)
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(
            [
              'Inline math $alpha$.',
              '',
              'Block math:',
              '',
              '$$',
              '[a,b;c,d]',
              '$$'
            ].join('\n')
          )
      )
    ).eq(
      String(
        await unified()
          .use(rehypeParse, { fragment: true })
          .use(rehypeStringify)
          .process(
            [
              '<p>Inline math ' + katex.renderToString('\\displaystyle{ \\alpha }') + '.</p>',
              '<p>Block math:</p>',
              katex.renderToString(String.raw`\displaystyle{ \left[ \begin{array}{cc} a & b \\ c & d \end{array} \right] }`, { displayMode: true })
            ].join('\n')
          )
      )
    )
  })
})