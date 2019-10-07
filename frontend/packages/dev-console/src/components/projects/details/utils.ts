import { connect } from 'react-redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';

export const PROJECT_LIST_URI = '/k8s/cluster/projects';

export const redirectURI = (ns) => `${PROJECT_LIST_URI}/${ns}`;

export const useActiveNamespace = (Component) =>
  connect((state: RootState) => ({ activeNamespace: getActiveNamespace(state) }))(Component);

export type UseActiveNamespaceProps = {
  activeNamespace: string;
};
