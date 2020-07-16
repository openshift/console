import * as React from 'react';
import cx from 'classnames';
import { Text, TextVariants } from '@patternfly/react-core';
import './QuickStartDescription.scss';

type QuickStartDescriptionProps = {
  description: string;
  prerequisites?: string[];
  unmetPrerequisite?: boolean;
};
const QuickStartDescription: React.FC<QuickStartDescriptionProps> = ({
  description,
  prerequisites,
  unmetPrerequisite = false,
}) => (
  <>
    <Text component={TextVariants.p} className="oc-quick-start-description__section">
      {description}
    </Text>
    {Array.isArray(prerequisites) && prerequisites?.length > 0 && (
      <div
        className={cx('oc-quick-start-description__section', {
          'oc-quick-start-description__unmetprerequisites': unmetPrerequisite,
        })}
      >
        <Text component={TextVariants.h5}>Prerequisites</Text>
        {prerequisites.map((prerequisite) => (
          <Text key={prerequisite} component={TextVariants.small}>
            {prerequisite}
          </Text>
        ))}
      </div>
    )}
  </>
);
export default QuickStartDescription;
