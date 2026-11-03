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

  const itemStarts = items.map((item) => formattedString.indexOf(item));

  return (
    <Footer>
      <>
        {items.map((item, index) => {
          const currentIdx = itemStarts[index];
          const prevEnd = index === 0 ? 0 : itemStarts[index - 1] + items[index - 1].length;
          const element = (
            <Fragment key={item}>
              {formattedString.slice(prevEnd, currentIdx)}
              <Button variant="link" isInline onClick={() => onShowItem(item)}>
                {item}
              </Button>
            </Fragment>
          );

          return element;
        })}
      </>
    </Footer>
  );
};
