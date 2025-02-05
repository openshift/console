import { useMemo } from 'react';
import { CopyIconConfig } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { getSvgFromPfIconConfig } from '@console/shared/src/utils/icon-utils';
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
        return `<b><div class="pf-v6-c-code-block">
        <div class="pf-v6-c-code-block__header">
          <div class="pf-v6-c-code-block__actions">
            <div class="pf-v6-c-code-block__actions-item">
              <button class="pf-v6-c-button pf-m-plain" type="button" aria-label="${t(
                'console-shared~Copy to clipboard',
              )}" ${MARKDOWN_COPY_BUTTON_ID}="${groupType}">
                ${getSvgFromPfIconConfig(CopyIconConfig)}
              </button>
            </div>
          </div>
        </div>
        <div class="pf-v6-c-code-block__content">
          <pre class="pf-v6-c-code-block__pre ocs-code-block__pre">
            <code class="pf-v6-c-code-block__code"
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
