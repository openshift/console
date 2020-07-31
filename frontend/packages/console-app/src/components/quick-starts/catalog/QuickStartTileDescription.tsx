import * as React from 'react';
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
}) => (
  <>
    <Text component={TextVariants.p} className="oc-quick-start-tile-description">
      {description}
    </Text>
    <div className="co-quick-start-tile-description">
      <Text component={TextVariants.h5}>Prerequisites</Text>
      <Text component={TextVariants.small}>{prerequisites}</Text>
    </div>
  </>
);
export default QuickStartTileDescription;
