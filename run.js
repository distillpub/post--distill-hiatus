const babel = require("@babel/core")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const mdx = require("@mdx-js/mdx")
const { readFileSync, writeFileSync } = require("fs")
const { MDXProvider, mdx: createElement } = require("@mdx-js/react")

const article = readFileSync("./index.md", "utf8")

const transform = (code) =>
  babel.transform(code, {
    plugins: [
      "@babel/plugin-transform-react-jsx",
      "@babel/plugin-proposal-object-rest-spread",
    ],
  }).code

const renderWithReact = async (mdxCode) => {
  const jsx = await mdx(mdxCode, { skipExport: true })
  const code = transform(jsx)
  const scope = { mdx: createElement }

  const fn = new Function(
    "React",
    ...Object.keys(scope),
    `${code}; return React.createElement(MDXContent)`
  )

  const element = fn(React, ...Object.values(scope))
  const components = {
    h1: ({ children }) =>
      React.createElement("h1", { style: { color: "tomato" } }, children),
  }

  const elementWithProvider = React.createElement(
    MDXProvider,
    { components },
    element
  )

  return renderToStaticMarkup(elementWithProvider)
}

const document = (article) => `
<!DOCTYPE html>

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1300" />
  <style id="distill-article-specific-styles"></style>
  <script src="https://distill.pub/template.v2.js"></script>
</head>

<body>
  <d-front-matter>
    <script type="text/json">{
      "title": "Distill Hiatus",
      "description": "After five years, Distill will be taking a break.",
      "authors": [
        {
          "author": "Editorial Team",
          "authorURL": "http://distill.pub",
          "affiliation": "Distill",
          "affiliationURL": "http://distill.pub"
        }
      ]
    }</script>
  </d-front-matter>

  <d-title>
    <h1>Distill Hiatus</h1>
  </d-title>

  <d-article>${article}</d-article>

  <d-appendix>
    <h3>Author Contributions</h3>
    <p>This article was drafted by Chris Olah, Nick Cammarata, Sam Greydanus, and Janelle Tam.</p>
    <h3>Acknowledgements</h3>
    <p>Distill has been supported by too many people over the years to have any hope of thanking everyone. We're especially grateful to Distill's authors for investing so much in their articles, and to our reviewers for generously giving so much time to help Distill.
    We're also grateful to the many people who helped us as we struggled with this decision over the last few years. Many people took time to talk with us about burn out, about whether Distill was a good structure, about how to wind Distill down graciously, and about this essay. We're also grateful to past and present Distill authors for being so understanding of our decision.</p>

    <d-footnote-list></d-footnote-list>
    <d-citation-list></d-citation-list>

  </d-appendix>
  <d-bibliography src="bibliography.bib"></d-bibliography>
</body>`

renderWithReact(article).then((articleHtml) =>
  writeFileSync("./public/index.html", document(articleHtml))
)
