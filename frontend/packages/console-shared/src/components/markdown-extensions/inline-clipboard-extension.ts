import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MARKDOWN_COPY_BUTTON_ID, MARKDOWN_SNIPPET_ID } from './const';

import './showdown-extension.scss';

const useInlineCopyClipboardShowdownExtension = () => {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      type: 'lang',
      regex: /`([^`](.*?)[^`])`{{copy}}/g,
      replace: (
        text: string,
        group: string,
        subGroup: string,
        groupType: string,
        groupId: string,
      ): string => {
        if (!group || !subGroup || !groupType || !groupId) return text;
        return `<b><div class="pf-v5-c-code-block">
        <div class="pf-v5-c-code-block__header">
          <div class="pf-v5-c-code-block__actions">
            <div class="pf-v5-c-code-block__actions-item">
              <button class="pf-v5-c-button pf-m-plain" type="button" aria-label="${t(
                'console-shared~Copy to clipboard',
              )}" ${MARKDOWN_COPY_BUTTON_ID}="${groupType}">
                <i class="fas fa-copy" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="pf-v5-c-code-block__content">
          <pre class="pf-v5-c-code-block__pre ocs-code-block__pre">
            <code class="pf-v5-c-code-block__code" 
              ${MARKDOWN_SNIPPET_ID}="${groupType}">${group.trim()}</code>
          </pre>
        </div>
      </div></b>`;
      },
    }),
    [t],
  );
};

export default useInlineCopyClipboardShowdownExtension;
