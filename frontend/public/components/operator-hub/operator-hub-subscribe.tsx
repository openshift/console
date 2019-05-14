import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Alert } from 'patternfly-react';

import { Firehose, LoadingBox, history, NsDropdown, resourcePathFromModel } from '../utils';
import { referenceForModel, K8sResourceKind, k8sUpdate, k8sCreate, apiVersionForModel } from '../../module/k8s';
import { SubscriptionModel, CatalogSourceConfigModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import { OperatorGroupKind, PackageManifestKind, ClusterServiceVersionLogo, SubscriptionKind, InstallPlanApproval, defaultChannelFor, supportedInstallModesFor } from '../operator-lifecycle-manager';
import { InstallModeType, installedFor, supports } from '../operator-lifecycle-manager/operator-group';
import { RadioGroup, RadioInput } from '../radio';
import { OPERATOR_HUB_CSC_BASE } from '../../const';
import { getOperatorProviderType } from './operator-hub-utils';
import { Tooltip } from '../utils/tooltip';

// TODO(alecmerdler): Use `React.useState` hooks instead of stateful component
export class OperatorHubSubscribeForm extends React.Component<OperatorHubSubscribeFormProps, OperatorHubSubscribeFormState> {
  constructor(props) {
    super(props);
    this.state = {
      targetNamespace: null,
      installMode: null,
      updateChannel: null,
      approval: InstallPlanApproval.Automatic,
    };
  }

  render() {
    if (!this.props.packageManifest.loaded || _.isEmpty(_.get(this.props.packageManifest, 'data'))) {
      return <LoadingBox />;
    }

    const {provider, channels = [], packageName} = this.props.packageManifest.data.status;
    const srcProvider = _.get(this.props.packageManifest.data, 'metadata.labels.opsrc-provider', 'custom');
    const providerType = getOperatorProviderType(this.props.packageManifest.data);

    const updateChannel = this.state.updateChannel || defaultChannelFor(this.props.packageManifest.data);
    const installMode = this.state.installMode || supportedInstallModesFor(this.props.packageManifest.data)(updateChannel)
      .reduce((preferredInstallMode, mode) => mode.type === InstallModeType.InstallModeTypeAllNamespaces
        ? InstallModeType.InstallModeTypeAllNamespaces
        : preferredInstallMode, InstallModeType.InstallModeTypeSingleNamespace);
    let targetNamespace = this.state.targetNamespace || this.props.targetNamespace;
    if (installMode === InstallModeType.InstallModeTypeAllNamespaces) {
      targetNamespace = _.get(this.props.operatorGroup, 'data', [] as OperatorGroupKind[]).find(og => og.metadata.name === 'global-operators').metadata.namespace;
    }
    const approval = this.state.approval || InstallPlanApproval.Automatic;

    const installModes = channels.find(ch => ch.name === updateChannel).currentCSVDesc.installModes;
    const supportsSingle = installModes.find(m => m.type === InstallModeType.InstallModeTypeSingleNamespace).supported;
    const supportsGlobal = installModes.find(m => m.type === InstallModeType.InstallModeTypeAllNamespaces).supported;
    const descFor = (mode: InstallModeType) => {
      if (mode === InstallModeType.InstallModeTypeAllNamespaces && supportsGlobal) {
        return 'Operator will be available in all namespaces.';
      }
      if (mode === InstallModeType.InstallModeTypeSingleNamespace && supportsSingle) {
        return 'Operator will be available in a single namespace only.';
      }
      return 'This mode is not supported by this Operator';
    };
    const subscriptionExists = (ns: string) => installedFor(this.props.subscription.data)(this.props.operatorGroup.data)(this.props.packageManifest.data.status.packageName)(ns);
    const namespaceSupports = (ns: string) => (mode: InstallModeType) => {
      const operatorGroup = this.props.operatorGroup.data.find(og => og.metadata.namespace === ns);
      if (!operatorGroup || !ns) {
        return true;
      }
      return supports([{type: mode, supported: true}])(operatorGroup);
    };

    const submit = () => {
      const OPERATOR_HUB_CSC_NAME = `${OPERATOR_HUB_CSC_BASE}-${srcProvider}-${targetNamespace}`;
      const catalogSourceConfig = this.props.catalogSourceConfig.data.find(csc => csc.metadata.name === OPERATOR_HUB_CSC_NAME);
      const hasBeenEnabled = !_.isEmpty(catalogSourceConfig) && _.includes(catalogSourceConfig.spec.packages.split(','), packageName);
      const packages = _.isEmpty(catalogSourceConfig)
        ? packageName
        : _.uniq(catalogSourceConfig.spec.packages.split(',').concat([packageName])).join(',');

      const newCatalogSourceConfig = {
        apiVersion: apiVersionForModel(CatalogSourceConfigModel),
        kind: CatalogSourceConfigModel.kind,
        metadata: {
          name: OPERATOR_HUB_CSC_NAME,
          namespace: 'openshift-marketplace',
        },
        spec: {
          targetNamespace,
          packages: `${packages}`,
          csDisplayName: `${providerType} Operators`,
          csPublisher: `${providerType}`,
        },
      };

      const operatorGroup: OperatorGroupKind = {
        apiVersion: apiVersionForModel(OperatorGroupModel) as OperatorGroupKind['apiVersion'],
        kind: 'OperatorGroup',
        metadata: {
          generateName: `${targetNamespace}-`,
          namespace: targetNamespace,
        },
        spec: {
          targetNamespaces: [targetNamespace],
        },
      };

      const subscription: SubscriptionKind = {
        apiVersion: apiVersionForModel(SubscriptionModel) as SubscriptionKind['apiVersion'],
        kind: 'Subscription',
        metadata: {
          name: packageName,
          namespace: targetNamespace,
          labels: {
            'csc-owner-name': OPERATOR_HUB_CSC_NAME,
            'csc-owner-namespace': 'openshift-marketplace',
          },
        },
        spec: {
          source: OPERATOR_HUB_CSC_NAME,
          sourceNamespace: targetNamespace,
          name: packageName,
          startingCSV: channels.find(ch => ch.name === updateChannel).currentCSV,
          channel: updateChannel,
          installPlanApproval: approval,
        },
      };

      // TODO(alecmerdler): Handle and display error from creating kube objects...
      return (!_.isEmpty(catalogSourceConfig) || hasBeenEnabled
        ? k8sUpdate(CatalogSourceConfigModel, {...catalogSourceConfig, spec: {...catalogSourceConfig.spec, packages}}, 'openshift-marketplace', OPERATOR_HUB_CSC_NAME)
        : k8sCreate(CatalogSourceConfigModel, newCatalogSourceConfig)
      ).then(() => this.props.operatorGroup.data.some(group => group.metadata.namespace === targetNamespace)
        ? Promise.resolve()
        : k8sCreate(OperatorGroupModel, operatorGroup))
        .then(() => k8sCreate(SubscriptionModel, subscription))
        .then(() => history.push(resourcePathFromModel(SubscriptionModel, packageName, subscription.metadata.namespace)));
    };

    return <React.Fragment>
      <div className="col-xs-6">
        <React.Fragment>
          <div className="form-group">
            <label className="co-required">Installation Mode</label>
            <div>
              <Tooltip content={descFor(InstallModeType.InstallModeTypeAllNamespaces)} hidden={!supportsGlobal}>
                <RadioInput
                  onChange={e => this.setState({installMode: e.target.value, targetNamespace: null})}
                  value={InstallModeType.InstallModeTypeAllNamespaces}
                  checked={installMode === InstallModeType.InstallModeTypeAllNamespaces}
                  disabled={!supportsGlobal}
                  title="All namespaces on the cluster"
                  subTitle="(default)">
                  <div className="co-m-radio-desc">
                    <p className="text-muted">{descFor(InstallModeType.InstallModeTypeAllNamespaces)}</p>
                  </div>
                </RadioInput>
              </Tooltip>
            </div>
            <div>
              <Tooltip content={descFor(InstallModeType.InstallModeTypeSingleNamespace)} hidden={!supportsSingle}>
                <RadioInput
                  onChange={e => this.setState({installMode: e.target.value, targetNamespace: null})}
                  value={InstallModeType.InstallModeTypeSingleNamespace}
                  checked={installMode === InstallModeType.InstallModeTypeSingleNamespace}
                  disabled={!supportsSingle}
                  title="A specific namespace on the cluster">
                  <div className="co-m-radio-desc">
                    <p className="text-muted">{descFor(InstallModeType.InstallModeTypeSingleNamespace)}</p>
                  </div>
                  { installMode === InstallModeType.InstallModeTypeSingleNamespace && <div style={{marginLeft: '20px'}}>
                    <NsDropdown
                      id="dropdown-selectbox"
                      selectedKey={targetNamespace}
                      // TODO(alecmerdler): We can check the `olm.providedAPIs` annotation to filter instead (when it's implemented)!
                      onChange={(ns: string) => this.setState({targetNamespace: ns})} />
                  </div> }
                </RadioInput>
              </Tooltip>
            </div>
          </div>
          <div className="form-group">
            <label className="co-required">Update Channel</label>
            <RadioGroup
              currentValue={updateChannel}
              items={channels.map(ch => ({value: ch.name, title: ch.name}))}
              onChange={(e) => this.setState({updateChannel: e.currentTarget.value, installMode: null, targetNamespace: null})} />
          </div>
          <div className="form-group">
            <label className="co-required">Approval Strategy</label>
            <RadioGroup
              currentValue={approval}
              items={[
                {value: InstallPlanApproval.Automatic, title: 'Automatic'},
                {value: InstallPlanApproval.Manual, title: 'Manual'},
              ]}
              onChange={(e) => this.setState({approval: e.currentTarget.value})} />
          </div>
        </React.Fragment>
        <div className="co-form-section__separator" />
        { !namespaceSupports(targetNamespace)(installMode) && <Alert type="error">Namespace does not support install modes for this Operator.</Alert> }
        { subscriptionExists(targetNamespace) && <Alert type="error">Operator subscription for namespace &quot;{targetNamespace}&quot; already exists.</Alert> }
        <React.Fragment>
          <button
            className="btn btn-primary"
            onClick={() => submit()}
            disabled={[updateChannel, installMode, targetNamespace, approval].some(v => _.isNil(v) || _.isEmpty(v))
              || subscriptionExists(targetNamespace)
              || !namespaceSupports(targetNamespace)(installMode)}>
            Subscribe
          </button>
          <button className="btn btn-default" onClick={() => history.push('/operatorhub')}>
            Cancel
          </button>
        </React.Fragment>
      </div>
      <div className="col-xs-6">
        <ClusterServiceVersionLogo displayName={_.get(channels, '[0].currentCSVDesc.displayName')} icon={_.get(channels, '[0].currentCSVDesc.icon[0]')} provider={provider} />
      </div>
    </React.Fragment>;
  }
}

export const OperatorHubSubscribePage: React.SFC<OperatorHubSubscribePageProps> = (props) => <div className="co-m-pane__body">
  <Helmet>
    <title>OperatorHub Subscription</title>
  </Helmet>
  <div>
    <h1>Create Operator Subscription</h1>
    <p className="co-help-text">
      Keep your service up to date by selecting a channel and approval strategy. The strategy determines either manual or automatic updates.
    </p>
  </div>
  <Firehose resources={[{
    isList: true,
    kind: referenceForModel(CatalogSourceConfigModel),
    namespace: 'openshift-marketplace',
    prop: 'catalogSourceConfig',
  }, {
    isList: true,
    kind: referenceForModel(OperatorGroupModel),
    prop: 'operatorGroup',
  }, {
    isList: false,
    kind: referenceForModel(PackageManifestModel),
    namespace: new URLSearchParams(window.location.search).get('catalogNamespace'),
    name: new URLSearchParams(window.location.search).get('pkg'),
    prop: 'packageManifest',
    selector: {matchLabels: {'openshift-marketplace': 'true'}},
  }, {
    isList: true,
    kind: referenceForModel(SubscriptionModel),
    prop: 'subscription',
  }]}>
    {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
    <OperatorHubSubscribeForm {...props as any} targetNamespace={new URLSearchParams(window.location.search).get('targetNamespace')} />
  </Firehose>
</div>;

type OperatorHubSubscribeFormState = {
  targetNamespace: string;
  installMode: InstallModeType;
  updateChannel: string;
  approval: InstallPlanApproval;
};

export type OperatorHubSubscribeFormProps = {
  loaded: boolean;
  loadError?: any;
  namespace: string;
  targetNamespace?: string;
  operatorGroup: {loaded: boolean, data: OperatorGroupKind[]};
  packageManifest: {loaded: boolean, data: PackageManifestKind};
  catalogSourceConfig: {loaded: boolean, data: K8sResourceKind[]};
  subscription: {loaded: boolean, data: SubscriptionKind[]};
};

export type OperatorHubSubscribePageProps = {

};

OperatorHubSubscribePage.displayName = 'OperatorHubSubscribePage';
