import type { ReactNode, FC } from 'react';
import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import { Marked } from 'marked';
import { useTranslation } from 'react-i18next';
import * as sanitizeHtml from 'sanitize-html';
import { THEME_DARK, THEME_DARK_CLASS, useTheme } from '@console/internal/components/ThemeProvider';
import { useForceRender } from '../../hooks/useForceRender';
import { useResizeObserver } from '../../hooks/useResizeObserver';

import './MarkdownView.scss';

export type MarkdownExtension = {
  type: string;
  regex: RegExp;
  replace: (text: string, ...groups: string[]) => string;
};

const tableTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td'];

const markedInstance = new Marked({
  async: false,
  gfm: true,
  renderer: {
    link({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

const markdownConvert = (markdown: string, extensions: MarkdownExtension[]) => {
  let processed = markdown;
  if (extensions) {
    for (const ext of extensions) {
      processed = processed.replace(ext.regex, ext.replace);
    }
  }

  const html = markedInstance.parse(processed);

  return sanitizeHtml(html, {
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

type RenderExtensionProps = {
  renderExtension: (contentDocument: Document, rootSelector: string) => ReactNode;
  selector: string;
  markup: string;
  docContext?: Document;
};

const RenderExtension: FC<RenderExtensionProps> = ({
  renderExtension,
  selector,
  markup,
  docContext,
}) => {
  const forceRender = useForceRender();
  const markupRef = useRef<string>(null);
  const shouldRenderExtension = useCallback(() => {
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
  useEffect(() => {
    renderExtension && forceRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markup]);
  return (
    <>{shouldRenderExtension() ? renderExtension?.(docContext ?? document, selector) : null}</>
  );
};

type InnerSyncMarkdownProps = Pick<MarkdownProps, 'renderExtension' | 'exactHeight'> & {
  markup: string;
  isEmpty: boolean;
};

const InlineMarkdownView: FC<InnerSyncMarkdownProps> = ({ markup, isEmpty, renderExtension }) => {
  const id = useMemo(() => _.uniqueId('markdown'), []);
  return (
    <div className={css('co-markdown-view', { 'is-empty': isEmpty })} id={id}>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <RenderExtension renderExtension={renderExtension} selector={`#${id}`} markup={markup} />
    </div>
  );
};

const IFrameMarkdownView: FC<InnerSyncMarkdownProps> = ({
  exactHeight,
  markup,
  isEmpty,
  renderExtension,
}) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const { theme } = useTheme();

  const themeClass = css({
    [THEME_DARK_CLASS]: theme === THEME_DARK,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateDimensions = useCallback(
    _.debounce(() => {
      const el = frameRef.current?.contentWindow?.document?.body?.firstElementChild;
      if (el) {
        setFrameHeight(el.scrollHeight + (exactHeight ? 0 : 15));
      }
    }, 100),
    [exactHeight],
  );

  const onLoad = useCallback(() => {
    updateDimensions();
    setLoaded(true);
  }, [updateDimensions]);

  useResizeObserver(updateDimensions, frameRef.current);

  // Find the app's stylesheets and inject them into the frame to ensure consistent styling.
  const linkRefs = useMemo(
    () =>
      Array.from(document.getElementsByTagName('link'))
        .filter((l) => _.includes(l.href, 'app-bundle'))
        .map((link) => `<link rel="stylesheet" href="${link.href}">`)
        .join('\n'),
    [],
  );

  const srcdoc = useMemo(
    () => `<!DOCTYPE html>
  <html ${themeClass ? `class="${themeClass}"` : ''}>
  <head>
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
  </head>
  <body class="pf-v6-c-content co-iframe"><div style="overflow-y: auto;">${markup}</div></body>
  </html>`,
    [themeClass, linkRefs, isEmpty, markup],
  );

  return (
    <>
      <iframe
        title="Markdown content viewer"
        aria-label="Markdown content viewer"
        role="document"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        srcDoc={srcdoc}
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

export type MarkdownProps = {
  content?: string;
  emptyMsg?: string;
  exactHeight?: boolean;
  truncateContent?: boolean;
  extensions?: MarkdownExtension[];
  renderExtension?: (contentDocument: Document, rootSelector: string) => ReactNode;
  inline?: boolean;
};

export const MarkdownView: FC<MarkdownProps> = ({
  truncateContent,
  content,
  emptyMsg: emptyMsgProp,
  extensions,
  renderExtension,
  exactHeight,
  inline,
}) => {
  const { t } = useTranslation('console-shared');
  const emptyMsg = emptyMsgProp || t('Not available');

  const markup = useMemo(() => {
    const truncatedContent = truncateContent
      ? _.truncate(content, {
          length: 256,
          separator: ' ',
          omission: '\u2026',
        })
      : content;
    return markdownConvert(truncatedContent || emptyMsg, extensions);
  }, [content, emptyMsg, extensions, truncateContent]);

  const innerProps: InnerSyncMarkdownProps = {
    renderExtension: extensions?.length > 0 ? renderExtension : undefined,
    exactHeight,
    markup,
    isEmpty: !content,
  };
  return inline ? <InlineMarkdownView {...innerProps} /> : <IFrameMarkdownView {...innerProps} />;
};
