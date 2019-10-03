import * as React from 'react';

const ConsumersBody: React.FC<ConsumersBodyProps> = React.memo(({ children }) => (
  <div className="co-consumers-card__body">{children}</div>
));

export default ConsumersBody;

type ConsumersBodyProps = {
  children?: React.ReactNode;
};
