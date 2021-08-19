import { RouteComponentProps } from 'react-router';
import { K8sResourceCommon } from '../extensions';

/* Horizontal Nav Types */
export type NavPage = {
  href?: string;
  path?: string;
  name: string;
  component: React.ComponentType<RouteComponentProps>;
};

export type HorizontalNavProps = {
  resource?: K8sResourceCommon;
  pages: NavPage[];
};
