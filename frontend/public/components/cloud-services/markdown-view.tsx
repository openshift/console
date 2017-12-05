import * as React from 'react';
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

export const SyncMarkdownView = (props: {content: string}) => {
  const contents = `
    <link href="static/app-bundle.css" rel="stylesheet">
    <style type="text/css">
    body {
        font-family: "Source Sans Pro", Helvetica, sans-serif';
        font-size: 16px;
        color: ${props.content ? 'black' : '#999'};
        background-color: transparent !important;
    }
    </style>
    <div>
        ${markdownConvert(props.content || 'Not available')}
    </div>`;

  return <iframe sandbox="allow-popups allow-same-origin" srcDoc={contents} style={{border: '0px', width: '100%', height: '100%'}} />;
};
