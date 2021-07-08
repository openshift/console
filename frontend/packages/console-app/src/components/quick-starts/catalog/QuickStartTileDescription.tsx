import * as React from 'react';
import {
  Button,
  Popover,
  Text,
  TextList,
  TextListItem,
  TextVariants,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import './QuickStartTileDescription.scss';

type QuickStartTileDescriptionProps = {
  description: string;
  prerequisites?: string[];
};

const QuickStartTileDescription: React.FC<QuickStartTileDescriptionProps> = ({
  description,
  prerequisites,
}) => {
  const { t } = useTranslation();
  const prereqs = prerequisites?.filter((p) => p);
  return (
    <>
      <Text component={TextVariants.p} className="co-quick-start-tile-description">
        {description}
      </Text>
      {prereqs?.length > 0 && (
        <div className="co-quick-start-tile-prerequisites">
          <Text component={TextVariants.h5} className="co-quick-start-tile-prerequisites__text">
            {t('console-app~Prerequisites ({{totalPrereqs}})', {
              totalPrereqs: prereqs.length,
            })}{' '}
          </Text>
          <Popover
            aria-label={t('console-app~Prerequisites')}
            headerContent={t('console-app~Prerequisites')}
            bodyContent={
              <TextList aria-label={t('console-app~Prerequisites')}>
                {prereqs.map((prerequisite, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <TextListItem key={index}>{prerequisite}</TextListItem>
                ))}
              </TextList>
            }
          >
            <Button
              variant="link"
              isInline
              className="co-quick-start-tile-prerequisites__icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              aria-label={t('console-app~Show prerequisites')}
            >
              <InfoCircleIcon />
            </Button>
          </Popover>
        </div>
      )}
    </>
  );
};
export default QuickStartTileDescription;
