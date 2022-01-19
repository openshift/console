import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { getLastLanguage } from '@console/app/src/components/user-preferences/language/getLastLanguage';

export interface ProgressiveListFooterProps {
  items: string[];
  onShowItem: (item: string) => void;
}

const ProgressiveListFooter: React.FC<ProgressiveListFooterProps> = ({ items, onShowItem }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const formattedString = new Intl.ListFormat(getLastLanguage() || 'en', {
    style: 'long',
    type: 'conjunction',
  }).format(items);

  let lastIdx = 0;
  let lastLen = 0;

  return (
    <>
      {items.map((item) => {
        const currentIdx = formattedString.indexOf(item);

        const element = (
          <React.Fragment key={item}>
            {formattedString.slice(lastIdx + lastLen, currentIdx)}
            <Button variant="link" isInline onClick={() => onShowItem(item)}>
              {item}
            </Button>
          </React.Fragment>
        );

        lastIdx = currentIdx;
        lastLen = item.length;

        return element;
      })}
    </>
  );
};

export default ProgressiveListFooter;
