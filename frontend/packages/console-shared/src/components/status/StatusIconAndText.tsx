import * as React from 'react';
import classNames from 'classnames';
import { CamelCaseWrap } from '@console/internal/components/utils';
import { DASH } from '../../constants';

type StatusIconAndTextProps = {
  icon?: React.ReactElement;
  title?: string;
  spin?: boolean;
  iconOnly?: boolean;
};

const StatusIconAndText: React.FC<StatusIconAndTextProps> = ({ icon, title, spin, iconOnly }) => {
  if (!title) {
    return <>{DASH}</>;
  }

  return (
    <span className="co-icon-and-text" title={title}>
      {icon &&
        React.cloneElement(icon, {
          className: classNames(
            spin && 'fa-spin',
            icon.props.className,
            !iconOnly && 'co-icon-and-text__icon co-icon-flex-child',
          ),
        })}
      {!iconOnly && <CamelCaseWrap value={title} />}
    </span>
  );
};

export default StatusIconAndText;
