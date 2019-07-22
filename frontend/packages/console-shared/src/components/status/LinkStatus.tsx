import * as React from 'react';
import * as History from 'history';
import { Link } from 'react-router-dom';
import StatusIconAndText from './StatusIconAndText';

type LinkStatusProps = React.ComponentProps<typeof StatusIconAndText> & {
  linkTitle?: string;
  linkTo?: History.LocationDescriptor;
};

const LinkStatus: React.FC<LinkStatusProps> = ({
  icon,
  title,
  spin,
  linkTitle,
  linkTo,
  iconOnly,
}) =>
  linkTo ? (
    <Link to={linkTo} title={linkTitle}>
      <StatusIconAndText icon={icon} title={title} spin={spin} iconOnly={iconOnly} />
    </Link>
  ) : (
    <StatusIconAndText icon={icon} title={title} spin={spin} iconOnly={iconOnly} />
  );

export default LinkStatus;
