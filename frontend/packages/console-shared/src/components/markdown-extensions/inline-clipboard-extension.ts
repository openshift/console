import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MARKDOWN_COPY_BUTTON_ID, MARKDOWN_SNIPPET_ID } from './const';
import { removeTemplateWhitespace } from './utils';

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
        return removeTemplateWhitespace(
          `<span class="pf-c-clipboard-copy pf-m-inline">
              <span class="pf-c-clipboard-copy__text" ${MARKDOWN_SNIPPET_ID}="${groupType}">${group}</span>
              <span class="pf-c-clipboard-copy__actions">
                <span class="pf-c-clipboard-copy__actions-item">
                  <button class="pf-c-button pf-m-plain" aria-label="${t(
                    'console-shared~Copy to clipboard',
                  )}" ${MARKDOWN_COPY_BUTTON_ID}="${groupType}">
                    <i class="fas fa-copy" />
                  </button>
                </span>
              </span>
            </span>`,
        );
      },
    }),
    [t],
  );
};

export default useInlineCopyClipboardShowdownExtension;
