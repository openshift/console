import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useCloudShellAvailable from '@console/app/src/components/cloud-shell/useCloudShellAvailable';
import { MARKDOWN_COPY_BUTTON_ID, MARKDOWN_EXECUTE_BUTTON_ID, MARKDOWN_SNIPPET_ID } from './const';

import './showdown-extension.scss';

const useMultilineExecuteCommandShowdownExtension = () => {
  const { t } = useTranslation();
  const showExecuteButton = useCloudShellAvailable();
  return useMemo(
    () => ({
      type: 'lang',
      regex: /```[\n]((.*?\n)+)```{{execute}}/g,
      replace: (
        text: string,
        group: string,
        subgroup: string,
        groupType: string,
        groupId: string,
      ): string => {
        if (!group || !subgroup || !groupType || !groupId) return text;
        return `<div class="pf-c-code-block">
              <div class="pf-c-code-block__header">
                <div class="pf-c-code-block__actions">
                  <div class="pf-c-code-block__actions-item">
                    <button class="pf-c-button pf-m-plain" type="button" aria-label="${t(
                      'console-shared~Copy to clipboard',
                    )}" ${MARKDOWN_COPY_BUTTON_ID}="${groupType}">
                      <i class="fas fa-copy" aria-hidden="true"></i>
                    </button>
                  </div>
                  ${
                    showExecuteButton
                      ? `<div class="pf-c-code-block__actions-item ocs-markdown-execute-snippet__action">
                      <button class="pf-c-button pf-m-plain ocs-markdown-execute-snippet__button" type="button" aria-label="${t(
                        'console-shared~Run in Web Terminal',
                      )}" ${MARKDOWN_EXECUTE_BUTTON_ID}="${groupType}">
                        <i class="fas fa-play" aria-hidden="true"></i>
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </button>
                    </div>`
                      : ''
                  }
                </div>
              </div>
              <div class="pf-c-code-block__content">
                <pre class="pf-c-code-block__pre ocs-code-block__pre">
                  <code class="pf-c-code-block__code" 
                    ${MARKDOWN_SNIPPET_ID}="${groupType}">${group}</code>
                </pre>
              </div>
            </div>`;
      },
    }),
    [showExecuteButton, t],
  );
};

export default useMultilineExecuteCommandShowdownExtension;
