// set html to markdown and markdown to html functions globally
const showdown = require('showdown') // bidirectional markdown to html converter
// TODO: add support for markdown tables
// TODO: sanitize output for XSS
// TODO: sanitize output for invalid markup
const showdownConverter = new showdown.Converter({
  noHeaderId: true, // don't add id attributes to headers
  omitExtraWLInCodeBlocks: true, // remove extra newline at the end of a code block
  simplifiedAutoLink: true, // parse links even if they're not enclosed in markdown syntax
  excludeTrailingPunctuationFromURLs: true, // another natural language link parsing option, e.g. www.example.com! doesn't add the excalamation point to the link
  strikethrough: true, // supports markdown strikethroughs
  openLinksInNewWindow: true // adds target="_blank" and rel="noopener noreferrer" to links
})

module.exports = (text) => {
  const convertedMarkdown = showdownConverter.makeHtml(text) // convert markdown to HTML
  return convertedMarkdown
}
