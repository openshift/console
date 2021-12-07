import * as React from 'react';
import classnames from 'classnames';

export const HintBlock: React.FC<HintBlockProps> = ({ title, children, className }) => {
  const classes = classnames('co-hint-block', className);

  return (
    <div className={classes}>
      <h2 className="co-hint-block__title h4">{title}</h2>
      <div className="co-hint-block__body">{children}</div>
    </div>
  );
};

export type HintBlockProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};
