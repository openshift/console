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
        {/* eslint-disable-next-line react/no-array-index-key -- parts are derived from items prop via formatToParts; index is the only stable key */}
        {parts.map((part, partIndex) => {
          if (part.type === 'literal') {
            // eslint-disable-next-line react/no-array-index-key
            return <Fragment key={partIndex}>{part.value}</Fragment>;
          }
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Button key={partIndex} variant="link" isInline onClick={() => onShowItem(part.value)}>
              {part.value}
            </Button>
          );
        })}
      </>
    </Footer>
  );
};
