import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Popover,
  Text,
  TextList,
  TextListItem,
  TextVariants,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';

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
  return (
    <>
      <Text component={TextVariants.p} className="oc-quick-start-tile-description">
        {description}
      </Text>
      {prerequisites?.length > 0 && (
        <div className="co-quick-start-tile-prerequisites">
          <Text component={TextVariants.h5} className="co-quick-start-tile-prerequisites__text">
            {t('quickstart~Prerequisites ({{totalPrereqs}})', {
              totalPrereqs: prerequisites.length,
            })}{' '}
          </Text>
          <Popover
            aria-label="Prerequisites"
            headerContent={<Text component={TextVariants.h5}>{t('quickstart~Prerequisites')}</Text>}
            bodyContent={
              <TextList aria-label="Prerequisites">
                {prerequisites.map((prerequisite, index) => (
                  <TextListItem key={index}>{prerequisite}</TextListItem> // eslint-disable-line react/no-array-index-key
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
