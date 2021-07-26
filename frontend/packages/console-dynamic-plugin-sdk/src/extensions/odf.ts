import { ExtensionK8sModel } from '../api/common-types';
import { ExtensionDeclaration, CodeRef, Extension } from '../types';

type ODFDashboardProps = {
  /** The name of the instance of the Storage Provider */
  name: string;
  /** The kind of the instance of the Storage Provider */
  kind: string;
};

/** Third party storage vendors inject dashboards for their System via this extension point */
export type ODFPluginDashboard = ExtensionDeclaration<
  'odf.plugin/dashboard',
  {
    /** The model for which this dashboard is related to */
    model: ExtensionK8sModel;
    component: CodeRef<React.ComponentType<ODFDashboardProps>>;
  }
>;

export const isODFDashboardPlugin = (e: Extension): e is ODFPluginDashboard =>
  e.type === 'odf.plugin/dashboard';
