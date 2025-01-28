/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';
import * as cx from 'classnames';
import * as _ from 'lodash';
import * as sanitizeHtml from 'sanitize-html';
import { Converter, ShowdownOptions, ShowdownExtension } from 'showdown';
import { useForceRender, useResizeObserver } from '../../hooks';

import './MarkdownView.scss';

const tableTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td'];

const markdownConvert = (
  markdown: string,
  extensions: ShowdownExtension[],
  options: ShowdownOptions = {},
) => {
  const converter = new Converter({
    tables: true,
    openLinksInNewWindow: true,
    strikethrough: true,
    emoji: true,
  });

  for (const [key, value] of Object.entries(options)) {
    converter.setOption(key, value);
  }

  extensions && converter.addExtension(extensions);

  return sanitizeHtml(converter.makeHtml(markdown), {
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
      'span',
      'div',
      ...tableTags,
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      button: ['class'],
      i: ['class'],
      div: ['class'],
      span: ['class'],
      pre: ['class'],
      code: ['class'],
      '*': ['data-*'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
};

export type MarkdownProps = {
  content?: string;
  emptyMsg: string;
  exactHeight?: boolean;
  truncateContent?: boolean;
  extensions?: ShowdownExtension[];
  renderExtension?: (contentDocument: Document, rootSelector: string) => React.ReactNode;
  inline?: boolean;
  options?: ShowdownOptions;
  theme?: string;
  updateThemeClass?: (htmlTagElement: HTMLElement, theme: string) => void;
};

type InnerSyncMarkdownProps = Pick<
  MarkdownProps,
  'renderExtension' | 'exactHeight' | 'theme' | 'updateThemeClass'
> & {
  markup: string;
  isEmpty: boolean;
};

export const MarkdownView: React.FC<MarkdownProps> = ({
  truncateContent,
  content,
  emptyMsg,
  extensions,
  renderExtension,
  exactHeight,
  inline,
  options,
  theme,
  updateThemeClass,
}) => {
  const markup = React.useMemo(() => {
    const truncatedContent = truncateContent
      ? _.truncate(content, {
          length: 256,
          separator: ' ',
          omission: '\u2026',
        })
      : content;
    return markdownConvert(truncatedContent || emptyMsg, extensions, options);
  }, [content, emptyMsg, extensions, options, truncateContent]);

  const innerProps: InnerSyncMarkdownProps = {
    renderExtension: extensions?.length > 0 ? renderExtension : undefined,
    exactHeight,
    markup,
    isEmpty: !content,
    theme,
    updateThemeClass,
  };
  return inline ? <InlineMarkdownView {...innerProps} /> : <IFrameMarkdownView {...innerProps} />;
};

type RenderExtensionProps = {
  renderExtension: (contentDocument: Document, rootSelector: string) => React.ReactNode;
  selector: string;
  markup: string;
  docContext?: Document;
};

const RenderExtension: React.FC<RenderExtensionProps> = ({
  renderExtension,
  selector,
  markup,
  docContext,
}) => {
  const forceRender = useForceRender();
  const markupRef = React.useRef<string>(null);
  const shouldRenderExtension = React.useCallback(() => {
    if (markupRef.current === markup) {
      return true;
    }
    markupRef.current = markup;
    return false;
  }, [markup]);
  /**
   * During a render cycle where markup changes, renderExtension receives an old copy of document
   * because react is still updating the dom using dangerouslySetInnerHTML with latest markdown markup.
   * Use forceRender to delay the rendering of the extension by one render cycle.
   */
  React.useEffect(() => {
    renderExtension && forceRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markup]);
  return (
    <>{shouldRenderExtension() ? renderExtension?.(docContext ?? document, selector) : null}</>
  );
};

const InlineMarkdownView: React.FC<InnerSyncMarkdownProps> = ({
  markup,
  isEmpty,
  renderExtension,
}) => {
  const id = React.useMemo(() => _.uniqueId('markdown'), []);
  return (
    <div className={cx('co-markdown-view', { 'is-empty': isEmpty })} id={id}>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <RenderExtension renderExtension={renderExtension} selector={`#${id}`} markup={markup} />
    </div>
  );
};

const IFrameMarkdownView: React.FC<InnerSyncMarkdownProps> = ({
  exactHeight,
  markup,
  isEmpty,
  renderExtension,
  theme,
  updateThemeClass,
}) => {
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateDimensions = React.useCallback(
    _.debounce(() => {
      if (frameRef.current?.contentWindow) {
        setFrameHeight(
          frameRef.current.contentWindow.document.body.firstElementChild.scrollHeight +
            (exactHeight ? 0 : 15),
        );
      }
    }, 100),
    [exactHeight],
  );

  const onLoad = React.useCallback(() => {
    updateDimensions();
    setLoaded(true);
  }, [updateDimensions]);

  useResizeObserver(updateDimensions, frameRef.current);

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

  const contents = `
  ${linkRefs}
  <style type="text/css">
  body {
    background-color: transparent !important;
    color: ${isEmpty ? '#999' : '#333'};
    font-family: var(--pf-t--global--font--family--body);
    min-width: auto !important;
  }
  table {
    display: block;
    margin-bottom: 11.5px;
    overflow-x: auto;
  }
  td,
  th {
    border-bottom: var(--pf-t--global--border--width--divider--default) solid var(--pf-t--global--border--color--default);
    padding: 10px;
    vertical-align: top;
  }
  th {
    padding-top: 0;
  }
  </style>
  <body class="pf-v6-c-content co-iframe"><div style="overflow-y: auto;">${markup}</div></body>`;

  // update the iframe's content
  React.useEffect(() => {
    if (frameRef.current?.contentDocument) {
      const doc = frameRef.current.contentDocument;
      doc.open();
      doc.write(contents);
      doc.close();

      // adjust height for current content
      const contentHeight = doc.body.scrollHeight;
      setFrameHeight(contentHeight);
      updateThemeClass(doc.documentElement, theme);
    }
  }, [contents, theme, updateThemeClass]);

  return (
    <>
      <iframe
        title={_.uniqueId('markdown-view')}
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        style={{ border: '0px', display: 'block', width: '100%', height: frameHeight }}
        ref={frameRef}
        onLoad={onLoad}
      />
      {loaded && (
        <RenderExtension
          markup={markup}
          selector={''}
          renderExtension={renderExtension}
          docContext={frameRef.current?.contentDocument}
        />
      )}
    </>
  );
};
