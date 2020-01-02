import { connect } from 'react-redux';
import { match as RMatch } from 'react-router';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';

export const MONITORING_NS_PAGE_URI = '/dev-monitoring/ns';
export const MONITORING_ALL_NS_PAGE_URI = '/dev-monitoring/all-namespaces';

export const redirectURI = (ns) =>
  ns === ALL_NAMESPACES_KEY ? `${MONITORING_ALL_NS_PAGE_URI}` : `${MONITORING_NS_PAGE_URI}/${ns}`;

export const connectActiveNamespace = (Component) =>
  connect((state: RootState) => ({ activeNamespace: getActiveNamespace(state) }))(Component);

export type ConnectActiveNamespaceProps = {
  activeNamespace: string;
  match: RMatch<{
    ns?: string;
  }>;
};
