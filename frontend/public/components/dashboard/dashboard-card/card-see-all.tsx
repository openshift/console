import * as React from 'react';
import { Button, OverlayTrigger, Popover } from 'patternfly-react';

const SEE_ALL = 'See all';

export const DashboardCardSeeAll: React.FC<DashboardCardTitleSeeAllProps> = React.memo(({ title, children }) => {
  if (React.Children.count(children) === 0) {
    return null;
  }
  const overlay = (
    <Popover id="popover" title={title}>
      {children}
    </Popover>
  );
  return (
    <OverlayTrigger overlay={overlay} placement="right" trigger={['click']} rootClose>
      <Button bsStyle="link" className="co-dashboard-card__see-all">{SEE_ALL}</Button>
    </OverlayTrigger>
  );
});

type DashboardCardTitleSeeAllProps = {
  children?: React.ReactNode;
  title: string;
}
