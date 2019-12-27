import { connect } from 'react-redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { match as RMatch } from 'react-router';

export const useActiveNamespace = (Component) =>
  connect((state: RootState) => ({ activeNamespace: getActiveNamespace(state) }))(Component);

export type UseActiveNamespaceProps = {
  activeNamespace: string;
  match: RMatch<{
    ns?: string;
  }>;
};
