import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';

export interface ProgressiveListFooterProps {
  items: string[];
  text: string;
  onShowItem: (item: string) => void;
}
export interface ProgressiveItemProps {
  item: string;
  onShowItem: (item: string) => void;
}

export const ProgressiveItem: React.FC<ProgressiveItemProps> = ({ item, onShowItem }) => (
  <Button variant="link" isInline onClick={() => onShowItem(item)}>
    {item}
  </Button>
);

const ProgressiveListFooter: React.FC<ProgressiveListFooterProps> = ({
  text,
  items,
  onShowItem,
}) => {
  const { t } = useTranslation();
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <div>
      {text}
      {items.map((opt, index) => {
        if (items.length - 1 === index) {
          if (items.length !== 1) {
            return (
              <React.Fragment key={opt}>
                <Trans t={t} ns="devconsole">
                  {' '}
                  and <ProgressiveItem item={opt} onShowItem={onShowItem} />.
                </Trans>
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={opt}>
              <Trans t={t} ns="devconsole">
                {' '}
                <ProgressiveItem item={opt} onShowItem={onShowItem} />.
              </Trans>
            </React.Fragment>
          );
        }
        if (items.length - 2 !== index) {
          return (
            <React.Fragment key={opt}>
              {' '}
              <Trans t={t} ns="devconsole">
                <ProgressiveItem item={opt} onShowItem={onShowItem} />,
              </Trans>
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={opt}>
            {' '}
            <Trans t={t} ns="devconsole">
              <ProgressiveItem item={opt} onShowItem={onShowItem} />
            </Trans>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressiveListFooter;
