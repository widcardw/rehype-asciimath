# Rehype asciimath

This plugin is inspired from [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex).

## Install

This package is ESM only. In Node.js (version 16+), install with npm:

```sh
npm install @widcardw/rehype-asciimath
```

## Use

Say our document input.html contains:

```html
<p>
  Lift(<code class="language-math">L</code>) can be determined by Lift Coefficient
  (<code class="language-math">C_L</code>) like the following equation.
</p>
<pre><code class="language-math">
  L = \frac{1}{2} \rho v^2 S C_L
</code></pre>
```

…and our module example.js contains:

```js
import rehypeDocument from 'rehype-document'
import rehypeKatex from 'rehype-katex'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {read, write} from 'to-vfile'
import {unified} from 'unified'

const file = await unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeDocument, {
    // Get the latest one from: <https://katex.org/docs/browser>.
    css: 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css'
  })
  .use(rehypeKatex)
  .use(rehypeStringify)
  .process(await read('input.html'))

file.basename = 'output.html'
await write(file)
```

…then running node example.js creates an output.html with:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>input</title>
<meta content="width=device-width, initial-scale=1" name="viewport">
<link href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" rel="stylesheet">
</head>
<body>
<p>
  Lift(<span class="katex"><!--…--></span>) can be determined by Lift Coefficient
  (<span class="katex"><!--…--></span>) like the following equation.
</p>
<span class="katex-display"><!--…--></span>
</body>
</html>
```

…open output.html in a browser to see the rendered math.

## API

This package exports no identifiers. The default export is `rehypeAsciimath`.

### `unified().use(rehypeAsciimath[, options])`

Render elements with a language-math (or math-display, math-inline) class with KaTeX.

##### Parameters

- options ([`Options`](#options)) — configuration

##### Returns

Transform (Transformer).

### `Options`

Configuration (TypeScript type).

##### Type

```ts
import type { AsciiMathConfig } from 'asciimath-parser'
import type { KatexOptions } from 'katex'
type Options = Omit<KatexOptions, 'displayMode' | 'throwOnError'> & {
  amEnabled: boolean // default to be `true`, else it will only render KaTeX
  amConfig?: AsciiMathConfig
}
```

See [`Options` on katex.org](https://katex.org/docs/options.html) and [`AsciimathConfig` on asciimath](https://asciimath.widcard.win) for more info.

## Related

- [`remark-math`](https://github.com/remarkjs/remark-math)
