import type { FC, ComponentProps } from 'react';
import * as History from 'history';
import { Link } from 'react-router-dom-v5-compat';
import { StatusIconAndText } from '@console/dynamic-plugin-sdk';

const LinkStatus: FC<LinkStatusProps> = ({ linkTitle, linkTo, ...other }) =>
  linkTo ? (
    <Link to={linkTo} title={linkTitle}>
      <StatusIconAndText {...other} />
    </Link>
  ) : (
    <StatusIconAndText {...other} />
  );

type LinkStatusProps = ComponentProps<typeof StatusIconAndText> & {
  linkTitle?: string;
  linkTo?: History.LocationDescriptor;
};

export default LinkStatus;
