import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useEventListener, useForceRender } from '../../hooks';
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
  const forceRender = useForceRender();
  /**
   * During the first render of component docContext is not updated with the latest copy of `document`
   * because we use `dangerouslySetInnerHTML` to set the markdown markup to a div.
   * So while react updates the dom with latest of markdown markup with `dangerouslySetInnerHTML`
   * this component mounts and access the old copy of dom in which there are no elements present
   * with querySelector.
   * So using forceRender to rerender the component and access the `document` in which markdown markup is present.
   */
  React.useEffect(() => {
    forceRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
