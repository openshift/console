import * as React from 'react';
import cx from 'classnames';
import { Text, TextVariants } from '@patternfly/react-core';
import './TourItemDescription.scss';

type TourItemDescriptionProps = {
  description: string;
  prerequisites?: string[];
  unmetPrerequisite?: boolean;
};
const TourItemDescription: React.FC<TourItemDescriptionProps> = ({
  description,
  prerequisites,
  unmetPrerequisite = false,
}) => (
  <>
    <Text component={TextVariants.p} className="oc-tour-item-description__section">
      {description}
    </Text>
    {Array.isArray(prerequisites) && prerequisites?.length > 0 && (
      <div
        className={cx('oc-tour-item-description__section', {
          'oc-tour-item-description__unmetprerequisites': unmetPrerequisite,
        })}
      >
        <Text component={TextVariants.h5}>Prerequisites</Text>
        {prerequisites.map((prerequisite) => (
          <Text component={TextVariants.small}>{prerequisite}</Text>
        ))}
      </div>
    )}
  </>
);
export default TourItemDescription;
