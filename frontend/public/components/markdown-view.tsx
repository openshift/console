import * as React from 'react';
import * as _ from 'lodash-es';
import { Converter } from 'showdown';
import * as sanitizeHtml from 'sanitize-html';

const tableTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td'];

const markdownConvert = (markdown) => {
  const unsafeHtml = new Converter({
    tables: true,
    openLinksInNewWindow: true,
    strikethrough: true,
    emoji: true,
  }).makeHtml(markdown);

  return sanitizeHtml(unsafeHtml, {
    allowedTags: [
      'b',
      'i',
      'strike',
      's',
      'del',
      'em',
      'strong',
      'a',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      ...tableTags,
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
};

export class SyncMarkdownView extends React.Component<
  { content: string; styles?: string; exactHeight?: boolean; truncateContent?: boolean },
  {}
> {
  private frame: any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.updateDimensions();
  }

  updateDimensions() {
    if (!this.frame?.contentWindow?.document.body.firstChild) {
      return;
    }
    this.frame.style.height = `${this.frame.contentWindow.document.body.firstChild.scrollHeight}px`;

    // Let the new height take effect, then reset again once we recompute
    setTimeout(() => {
      if (this.props.exactHeight) {
        this.frame.style.height = `${this.frame.contentWindow.document.body.firstChild.scrollHeight}px`;
      } else {
        // Increase by 15px for the case where a horizontal scrollbar might appear
        this.frame.style.height = `${this.frame.contentWindow.document.body.firstChild
          .scrollHeight + 15}px`;
      }
    });
  }

  render() {
    // Find the app's stylesheets and inject them into the frame to ensure consistent styling.
    const filteredLinks = Array.from(document.getElementsByTagName('link')).filter((l) =>
      _.includes(l.href, 'app-bundle'),
    );

    const linkRefs = _.reduce(
      filteredLinks,
      (refs, link) => `${refs}
        <link rel="stylesheet" href="${link.href}">`,
      '',
    );
    const content = this.props.truncateContent
      ? _.truncate(this.props.content, {
          length: 256,
          separator: ' ',
          omission: '\u2026',
        })
      : this.props.content;

    const contents = `
      ${linkRefs}
      <style type="text/css">
      body {
        background-color: transparent !important;
        color: ${content ? '#333' : '#999'};
        font-family: var(--pf-global--FontFamily--sans-serif);
        min-width: auto !important;
      }
      table {
        display: block;
        margin-bottom: 11.5px;
        overflow-x: auto;
      }
      td,
      th {
        border-bottom: 1px solid #ededed;
        padding: 10px;
        vertical-align: top;
      }
      th {
        padding-top: 0;
      }
      ${this.props.styles ? this.props.styles : ''}
      </style>
      <body class="pf-m-redhat-font"><div style="overflow-y: auto;">${markdownConvert(
        content || 'Not available',
      )}</div></body>`;
    return (
      <iframe
        sandbox="allow-popups allow-same-origin"
        srcDoc={contents}
        style={{ border: '0px', display: 'block', width: '100%', height: '0' }}
        ref={(r) => (this.frame = r)}
        onLoad={() => this.updateDimensions()}
      />
    );
  }
}
