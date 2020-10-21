import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextVariants } from '@patternfly/react-core';

import './QuickStartTileDescription.scss';

type QuickStartTileDescriptionProps = {
  description: string;
  prerequisites?: string;
  unmetPrerequisite?: boolean;
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
      <div className="co-quick-start-tile-description">
        {prerequisites && (
          <>
            <Text component={TextVariants.h5}>{t('quickstart~Prerequisites')}</Text>
            <Text component={TextVariants.small}>{prerequisites}</Text>
          </>
        )}
      </div>
    </>
  );
};
export default QuickStartTileDescription;
