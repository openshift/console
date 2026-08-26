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

  const parts = new Intl.ListFormat(getLastLanguage() || 'en', {
    style: 'long',
    type: 'conjunction',
  }).formatToParts(items);

  return (
    <Footer>
      <>
        {parts.map((part, partIndex) => {
          // Literal parts are separators/conjunctions (e.g. ", " or " and ") — render as text
          if (part.type === 'literal') {
            // eslint-disable-next-line react/no-array-index-key -- index is the only stable key for literal separator parts
            return <Fragment key={partIndex}>{part.value}</Fragment>;
          }
          // Element parts correspond to each item — render as clickable buttons
          return (
            // eslint-disable-next-line react/no-array-index-key -- index is the only stable key for element parts with potential duplicates
            <Button key={partIndex} variant="link" isInline onClick={() => onShowItem(part.value)}>
              {part.value}
            </Button>
          );
        })}
      </>
    </Footer>
  );
};
