import * as React from 'react';

export const ConsumersBody: React.FC<ConsumersBodyProps> = React.memo(({ children }) => (
  <div className="co-consumers-card__body">
    {children}
  </div>
));

type ConsumersBodyProps = {
  children?: React.ReactNode;
};
