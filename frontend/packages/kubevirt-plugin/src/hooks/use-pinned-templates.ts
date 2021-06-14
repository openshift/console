import * as React from 'react';
import { TEMPLATE_PIN, TEMPLATE_PIN_PROMOTED } from '../constants';
import { TemplateItem } from '../types/template';
import { useLocalStorage } from './use-local-storage';

const isPromoted = (templateItem: TemplateItem): boolean =>
  templateItem.isCommon && templateItem.metadata.name.includes('rhel');

export const usePinnedTemplates = (): [
  (item: TemplateItem) => boolean,
  (item: TemplateItem) => void,
] => {
  const [promotedOut, setPromotedOut] = useLocalStorage(TEMPLATE_PIN_PROMOTED);
  const [pins, setPins] = useLocalStorage(TEMPLATE_PIN);

  const promotedOutTemplates = React.useMemo(() => promotedOut?.split(',') ?? [], [promotedOut]);
  const pinnedTemplates = React.useMemo(() => pins?.split(',') ?? [], [pins]);

  const togglePin = React.useCallback(
    (templateItem: TemplateItem) => {
      let template = templateItem.variants.find(({ metadata }) =>
        promotedOutTemplates.includes(metadata.uid),
      );
      if (template) {
        const newPromotedOut = [...promotedOutTemplates];
        newPromotedOut.splice(promotedOutTemplates.indexOf(template.metadata.uid), 1);
        setPromotedOut(newPromotedOut.join(','));
      } else if (isPromoted(templateItem)) {
        setPromotedOut([...promotedOutTemplates, templateItem.metadata.uid].join(','));
      } else {
        template = templateItem.variants.find(({ metadata }) =>
          pinnedTemplates.includes(metadata.uid),
        );
        if (template) {
          const newPinned = [...pinnedTemplates];
          newPinned.splice(pinnedTemplates.indexOf(template.metadata.uid), 1);
          setPins(newPinned.join(','));
        } else {
          setPins([...pinnedTemplates, templateItem.metadata.uid].join(','));
        }
      }
    },
    [pinnedTemplates, promotedOutTemplates, setPins, setPromotedOut],
  );

  const isPinned = React.useCallback(
    (templateItem: TemplateItem) => {
      if (
        isPromoted(templateItem) &&
        !templateItem.variants.some(({ metadata }) => promotedOutTemplates.includes(metadata.uid))
      ) {
        return true;
      }
      return templateItem.variants.some(({ metadata }) => pinnedTemplates.includes(metadata.uid));
    },
    [pinnedTemplates, promotedOutTemplates],
  );

  return [isPinned, togglePin];
};
