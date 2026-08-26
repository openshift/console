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

  // Use formatToParts instead of format + manual string slicing. The previous approach
  // tracked mutable index variables (lastIdx, lastLen) inside .map(), which violates
  // React Compiler immutability rules. formatToParts returns structured parts — 'literal'
  // for separators/conjunctions (e.g. ", ", " and ") and 'element' for each item — so we
  // can render each part directly without string position math. This also correctly handles
  // duplicate items and items whose text matches a conjunction word (e.g. "and").
  const parts = new Intl.ListFormat(getLastLanguage() || 'en', {
    style: 'long',
    type: 'conjunction',
  }).formatToParts(items);

  return (
    <Footer>
      <>
        {/* eslint-disable-next-line react/no-array-index-key -- parts are derived from items prop via formatToParts; index is the only stable key */}
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
