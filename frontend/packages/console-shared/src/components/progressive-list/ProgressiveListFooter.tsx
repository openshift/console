import type { ReactNode, FC } from 'react';
import { Fragment } from 'react';
import { Button } from '@patternfly/react-core';
import { getLastLanguage } from '@console/app/src/components/user-preferences/language/getLastLanguage';

export interface ProgressiveListFooterProps {
  items: string[];
  onShowItem: (item: string) => void;
  Footer: FC<{ children?: ReactNode }>;
}

export const ProgressiveListFooter: FC<ProgressiveListFooterProps> = ({
  items,
  onShowItem,
  Footer,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  const formattedString = new Intl.ListFormat(getLastLanguage() || 'en', {
    style: 'long',
    type: 'conjunction',
  }).format(items);

  const positions = items.map((item) => formattedString.indexOf(item));

  return (
    <Footer>
      <>
        {items.map((item, i) => {
          const currentIdx = positions[i];
          const prevEnd = i > 0 ? positions[i - 1] + items[i - 1].length : 0;
          return (
            <Fragment key={item}>
              {formattedString.slice(prevEnd, currentIdx)}
              <Button variant="link" isInline onClick={() => onShowItem(item)}>
                {item}
              </Button>
            </Fragment>
          );
        })}
      </>
    </Footer>
  );
};
