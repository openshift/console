import * as React from 'react';
import { useTranslation } from 'react-i18next';
import useCloudShellAvailable from '@console/app/src/components/cloud-shell/useCloudShellAvailable';
import { useCloudShellCommandDispatch } from '@console/app/src/redux/actions/cloud-shell-dispatchers';
import { useEventListener } from '../../hooks';
import { Tooltip } from '../Tooltip/Tooltip';
import { MARKDOWN_EXECUTE_BUTTON_ID, MARKDOWN_SNIPPET_ID } from './const';

type ExecuteSnippetProps = {
  element: HTMLElement;
  rootSelector: string;
  docContext: HTMLDocument;
};

export const ExecuteSnippet: React.FC<ExecuteSnippetProps> = ({
  element,
  rootSelector,
  docContext,
}) => {
  const { t } = useTranslation();
  const setCloudShellCommand = useCloudShellCommandDispatch();
  const [showRunning, setShowRunning] = React.useState<boolean>(false);
  const textToExecute = React.useMemo(() => {
    const executeTextId = element.getAttribute(MARKDOWN_EXECUTE_BUTTON_ID);
    return (docContext.querySelector(
      `${rootSelector} [${MARKDOWN_SNIPPET_ID}="${executeTextId}"]`,
    ) as HTMLElement).innerText;
  }, [element, rootSelector, docContext]);

  useEventListener(
    element,
    'click',
    React.useCallback(() => {
      setCloudShellCommand(textToExecute);
      setShowRunning(true);
      element.setAttribute('data-executed', '');
    }, [textToExecute, element, setCloudShellCommand]),
  );

  return (
    <Tooltip
      reference={() => element}
      content={
        showRunning
          ? t('console-shared~Running in Web Terminal')
          : t('console-shared~Run in Web Terminal')
      }
      onShow={() => {
        element.removeAttribute('data-executed');
      }}
      onHide={() => {
        setShowRunning(false);
      }}
    />
  );
};

type MarkdownExecuteCommandProps = {
  docContext: HTMLDocument;
  rootSelector: string;
};

const MarkdownExecuteSnippet: React.FC<MarkdownExecuteCommandProps> = ({
  docContext,
  rootSelector,
}) => {
  const elements = docContext.querySelectorAll(`${rootSelector} [${MARKDOWN_EXECUTE_BUTTON_ID}]`);
  const showExecuteButton = useCloudShellAvailable();
  return elements.length > 0 && showExecuteButton ? (
    <>
      {Array.from(elements).map((elm) => {
        const attributeValue = elm.getAttribute(MARKDOWN_EXECUTE_BUTTON_ID);
        return (
          <ExecuteSnippet
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

export default MarkdownExecuteSnippet;
