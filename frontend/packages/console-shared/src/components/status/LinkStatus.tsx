import * as React from 'react';
import * as History from 'history';
import { Link } from 'react-router-dom';
import StatusIconAndText from './StatusIconAndText';

type LinkStatusProps = React.ComponentProps<typeof StatusIconAndText> & {
  linkTitle?: string;
  linkTo?: History.LocationDescriptor;
};

const LinkStatus: React.FC<LinkStatusProps> = ({ linkTitle, linkTo, ...other }) =>
  linkTo ? (
    <Link to={linkTo} title={linkTitle}>
      <StatusIconAndText {...other} />
    </Link>
  ) : (
    <StatusIconAndText {...other} />
  );

export default LinkStatus;
