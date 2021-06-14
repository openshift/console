import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useCloudShellAvailable from '@console/app/src/components/cloud-shell/useCloudShellAvailable';
import { MARKDOWN_COPY_BUTTON_ID, MARKDOWN_EXECUTE_BUTTON_ID, MARKDOWN_SNIPPET_ID } from './const';
import { removeTemplateWhitespace } from './utils';

import './showdown-extension.scss';

const useInlineExecuteCommandShowdownExtension = () => {
  const { t } = useTranslation();
  const showExecuteButton = useCloudShellAvailable();
  return useMemo(
    () => ({
      type: 'lang',
      regex: /`([^`](.*?)[^`])`{{execute}}/g,
      replace: (
        text: string,
        group: string,
        subGroup: string,
        groupType: string,
        groupId: string,
      ): string => {
        if (!group || !subGroup || !groupType || !groupId) return text;
        return removeTemplateWhitespace(
          `<span class="pf-c-clipboard-copy pf-m-inline">
              <span class="pf-c-clipboard-copy__text" ${MARKDOWN_SNIPPET_ID}="${groupType}">${group}</span>
              <span class="pf-c-clipboard-copy__actions">
                <span class="pf-c-clipboard-copy__actions-item">
                  <button class="pf-c-button pf-m-plain" aria-label="${t(
                    'console-shared~Copy to clipboard',
                  )}" ${MARKDOWN_COPY_BUTTON_ID}="${groupType}">
                    <i class="fas fa-copy" aria-hidden="true"></i>
                  </button>
                </span>
                ${
                  showExecuteButton
                    ? `<span class="pf-c-clipboard-copy__actions-item ocs-markdown-execute-snippet__action">
                    <button class="pf-c-button pf-m-plain ocs-markdown-execute-snippet__button" aria-label="${t(
                      'console-shared~Run in Web Terminal',
                    )}" ${MARKDOWN_EXECUTE_BUTTON_ID}="${groupType}">
                      <i class="fas fa-play" aria-hidden="true"></i>
                      <i class="fas fa-check" aria-hidden="true"></i>
                    </button>
                  </span>`
                    : ''
                }
              </span>
            </span>`,
        );
      },
    }),
    [showExecuteButton, t],
  );
};

export default useInlineExecuteCommandShowdownExtension;
