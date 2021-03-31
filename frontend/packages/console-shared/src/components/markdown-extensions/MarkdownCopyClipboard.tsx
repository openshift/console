import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useEventListener } from '../../hooks';
import { Tooltip } from '../Tooltip/Tooltip';
import { MARKDOWN_COPY_BUTTON_ID, MARKDOWN_SNIPPET_ID } from './const';

type CopyClipboardProps = {
  element: HTMLElement;
  rootSelector: string;
  docContext: HTMLDocument;
};

export const CopyClipboard: React.FC<CopyClipboardProps> = ({
  element,
  rootSelector,
  docContext,
}) => {
  const { t } = useTranslation();
  const [showSuccessContent, setShowSuccessContent] = React.useState<boolean>(false);
  const textToCopy = React.useMemo(() => {
    const copyTextId = element.getAttribute(MARKDOWN_COPY_BUTTON_ID);
    return (docContext.querySelector(
      `${rootSelector} [${MARKDOWN_SNIPPET_ID}="${copyTextId}"]`,
    ) as HTMLElement).innerText;
  }, [element, docContext, rootSelector]);

  useEventListener(
    element,
    'click',
    React.useCallback(() => {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setShowSuccessContent(true);
        })
        .catch(() => {});
    }, [textToCopy]),
  );

  return (
    <Tooltip
      reference={() => element as HTMLElement}
      content={
        showSuccessContent
          ? t('console-shared~Successfully copied to clipboard!')
          : t('console-shared~Copy to clipboard')
      }
      onHide={() => {
        setShowSuccessContent(false);
      }}
    />
  );
};

type MarkdownCopyClipboardProps = {
  docContext: HTMLDocument;
  rootSelector: string;
};

const MarkdownCopyClipboard: React.FC<MarkdownCopyClipboardProps> = ({
  docContext,
  rootSelector,
}) => {
  const elements = docContext.querySelectorAll(`${rootSelector} [${MARKDOWN_COPY_BUTTON_ID}]`);
  return elements.length > 0 ? (
    <>
      {Array.from(elements).map((elm) => {
        const attributeValue = elm.getAttribute(MARKDOWN_COPY_BUTTON_ID);
        return (
          <CopyClipboard
            key={attributeValue}
            element={elm as HTMLElement}
            rootSelector={rootSelector}
            docContext={docContext}
          />
        );
      })}
    </>
  ) : null;
};

export default MarkdownCopyClipboard;
