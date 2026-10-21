import type { ReactElement, FC } from 'react';
import { cloneElement } from 'react';
import { css } from '@patternfly/react-styles';
import type { StatusComponentProps } from '../../../extensions/console-types';
import { DASH } from '../../constants';
import CamelCaseWrap from '../utils/camel-case-wrap';

type StatusIconAndTextProps = StatusComponentProps & {
  icon?: ReactElement;
  spin?: boolean;
};

/**
 * Component for displaying a status icon and text
 * @param {string} [title] - (optional) status text
 * @param {boolean} [iconOnly] - (optional) if true, only displays icon
 * @param {boolean} [noTooltip] - (optional) if true, tooltip won't be displayed
 * @param {string} [className] - (optional) additional class name for the component
 * @param {React.ReactElement} [icon] - (optional) icon to be displayed
 * @param {boolean} [spin] - (optional) if true, icon rotates
 * @example
 * ```tsx
 * <StatusIconAndText title={title} icon={renderIcon} />
 * ```
 */
const StatusIconAndText: FC<StatusIconAndTextProps> = ({
  icon,
  title,
  spin,
  iconOnly,
  noTooltip,
  className,
}) => {
  if (!title) {
    return <>{DASH}</>;
  }

  return (
    <span
      className={css('co-icon-and-text', className)}
      title={iconOnly && !noTooltip ? title : undefined}
    >
      {icon &&
        cloneElement(icon, {
          className: css(
            spin && 'co-spin',
            icon.props.className,
            !iconOnly && 'co-icon-and-text__icon co-icon-flex-child',
          ),
        })}
      {!iconOnly && <CamelCaseWrap value={title} dataTest="status-text" />}
    </span>
  );
};

export default StatusIconAndText;
