import * as React from 'react';
import classNames from 'classnames';
import { CamelCaseWrap } from '@console/internal/components/utils';
import { DASH } from '../../constants';
import { StatusComponentProps } from './types';

type StatusIconAndTextProps = StatusComponentProps & {
  icon?: React.ReactElement;
  spin?: boolean;
};

const StatusIconAndText: React.FC<StatusIconAndTextProps> = ({
  icon,
  title,
  spin,
  iconOnly,
  noTooltip,
}) => {
  if (!title) {
    return <>{DASH}</>;
  }

  return (
    <span className="co-icon-and-text" title={iconOnly && !noTooltip ? title : undefined}>
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
