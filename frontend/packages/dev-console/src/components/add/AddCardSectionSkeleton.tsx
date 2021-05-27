import * as React from 'react';
import { Card, Skeleton } from '@patternfly/react-core';
import './AddCardSectionSkeleton.scss';

const AddCardSectionSkeleton: React.FC = () => {
  return (
    <Card className="odc-add-section-skeleton-placeholder__container">
      <Skeleton width="75%" height="30px" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i.toString()}>
          <div className="odc-add-section-skeleton-placeholder__item-header">
            <Skeleton width="24px" shape="circle" />
            <Skeleton
              width="60%"
              height="24px"
              className="odc-add-section-skeleton-placeholder__item-header__title"
            />
          </div>
          <div className="odc-add-section-skeleton-placeholder__item-desc">
            <Skeleton width="90%" height="15px" />
            <Skeleton width="85%" height="15px" />
            <Skeleton width="60%" height="15px" />
          </div>
        </div>
      ))}
    </Card>
  );
};

export default AddCardSectionSkeleton;
