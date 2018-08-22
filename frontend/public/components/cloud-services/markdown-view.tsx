/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Converter } from 'showdown';
import * as sanitizeHtml from 'sanitize-html';

const markdownConvert = (markdown) => {
  const unsafeHtml = new Converter({
    openLinksInNewWindow: true,
    strikethrough: true,
    emoji: true,
  }).makeHtml(markdown);

  return sanitizeHtml(unsafeHtml, {
    allowedTags: ['b', 'i', 'strike', 's', 'del', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'code', 'pre'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', {rel: 'noopener noreferrer'}, true),
    },
  });
};

export class SyncMarkdownView extends React.Component<{content: string}, {}> {
  private frame: any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.updateDimensions();
  }

  updateDimensions() {
    if (!this.frame || !this.frame.contentWindow.document.body ||
        !this.frame.contentWindow.document.body.firstChild) {
      return;
    }
    this.frame.style.height = `${this.frame.contentWindow.document.body.firstChild.offsetHeight + 50}px`;
  }

  render() {
    // Find the app's stylesheet and inject it into the frame to ensure consistent styling.
    const filteredLinks = Array.from(document.getElementsByTagName('link')).filter((l) => _.includes(l.href, 'app-bundle'));

    const contents = `
      <link rel="stylesheet" href="${filteredLinks[0].href}">
      <style type="text/css">
      body {
          color: ${this.props.content ? '#333' : '#999'};
          background-color: transparent !important;
          min-width: auto !important;
          font-family: "Open Sans",Helvetica,Arial,sans-serif
      }
      </style>
      <body><div>${markdownConvert(this.props.content || 'Not available')}</div></body>`;

    return <iframe sandbox="allow-popups allow-same-origin" srcDoc={contents} style={{border: '0px', width: '100%', height: '100%'}} ref={(r) => this.frame = r} onLoad={() => this.updateDimensions()} />;
  }
}
