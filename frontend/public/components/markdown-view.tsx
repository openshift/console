import * as React from 'react';
import * as _ from 'lodash-es';
import { Converter } from 'showdown';
import * as sanitizeHtml from 'sanitize-html';

const tableTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td'];

const markdownConvert = (markdown, extensions?: string[]) => {
  const unsafeHtml = new Converter({
    tables: true,
    openLinksInNewWindow: true,
    strikethrough: true,
    emoji: true,
    extensions,
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
      'button',
      ...tableTags,
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'data-*'],
      button: ['class', 'data-*'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
};

type SyncMarkdownProps = {
  content: string;
  emptyMsg?: string;
  styles?: string;
  exactHeight?: boolean;
  truncateContent?: boolean;
  extensions?: string[];
  renderExtension?: (contentDocument: HTMLDocument) => React.ReactNode;
};

type State = {
  loaded?: boolean;
};

export class SyncMarkdownView extends React.Component<SyncMarkdownProps, State> {
  private frame: any;
  private timeoutHandle: any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.updateDimensions();
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutHandle);
  }

  updateDimensions() {
    if (!this.frame?.contentWindow?.document.body.firstChild) {
      return;
    }
    this.frame.style.height = `${this.frame.contentWindow.document.body.firstChild.scrollHeight}px`;

    // Let the new height take effect, then reset again once we recompute
    this.timeoutHandle = setTimeout(() => {
      if (this.props.exactHeight) {
        this.frame.style.height = `${this.frame.contentWindow.document.body.firstChild.scrollHeight}px`;
      } else {
        // Increase by 15px for the case where a horizontal scrollbar might appear
        this.frame.style.height = `${this.frame.contentWindow.document.body.firstChild
          .scrollHeight + 15}px`;
      }
    });
  }

  onLoad() {
    this.updateDimensions();
    this.setState({ loaded: true });
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

    const emptyMsg = this.props.emptyMsg;

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
        content || emptyMsg || 'Not available',
        this.props.extensions,
      )}</div></body>`;
    const hasExtension = this.props.extensions?.length > 0 && !!this.props.renderExtension;
    return (
      <>
        <iframe
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          srcDoc={contents}
          style={{ border: '0px', display: 'block', width: '100%', height: '0' }}
          ref={(r) => (this.frame = r)}
          onLoad={() => this.onLoad()}
        />
        {this.state?.loaded &&
          this.frame?.contentDocument &&
          hasExtension &&
          this.props.renderExtension(this.frame.contentDocument)}
      </>
    );
  }
}
