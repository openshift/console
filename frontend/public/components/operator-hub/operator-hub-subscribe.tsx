/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Alert } from 'patternfly-react';

import { Firehose, LoadingBox, history, NsDropdown, resourcePathFromModel } from '../utils';
import { referenceForModel, K8sResourceKind, k8sUpdate, k8sCreate, apiVersionForModel } from '../../module/k8s';
import { SubscriptionModel, CatalogSourceConfigModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import { OperatorGroupKind, PackageManifestKind, ClusterServiceVersionLogo, SubscriptionKind, InstallPlanApproval, installModesFor, defaultChannelFor } from '../operator-lifecycle-manager';
import { InstallModeType, isGlobal, installedFor, supports } from '../operator-lifecycle-manager/operator-group';
import { RadioGroup, RadioInput } from '../radio';
import { OPERATOR_HUB_CSC_BASE } from '../../const';
import { getOperatorProviderType } from './operator-hub-utils';
import { Tooltip } from '../utils/tooltip';

// TODO: Use `redux-form` or React hooks instead of stateful component
const withFormState = <P extends WithFormStateProps>(Component: React.ComponentType<P>) => {
  /**
   * Controlled component which holds form state (https://reactjs.org/docs/forms.html#controlled-components).
   */
  return class WithFormState extends React.Component<P, FormData> {
    static WrappedComponent = Component;

    state = {
      targetNamespace: null,
      installMode: null,
      updateChannel: null,
      approval: InstallPlanApproval.Automatic,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
      const updateChannel = !_.isEmpty(_.get(nextProps.packageManifest, 'data')) ? defaultChannelFor(nextProps.packageManifest.data) : null;
      const installMode = prevState.installMode || !_.isEmpty(_.get(nextProps.packageManifest, 'data'))
        ? installModesFor(nextProps.packageManifest.data)(updateChannel)
          .filter(({supported}) => supported)
          .reduce((acc, mode) => mode.type === InstallModeType.InstallModeTypeAllNamespaces
            ? InstallModeType.InstallModeTypeAllNamespaces
            : acc,
          InstallModeType.InstallModeTypeSingleNamespace)
        : null;
      let targetNamespace = prevState.targetNamespace || nextProps.targetNamespace;
      if (installMode === InstallModeType.InstallModeTypeAllNamespaces) {
        // FIXME(alecmerdler): Will throw error if no global `OperatorGroup`
        targetNamespace = _.get(nextProps.operatorGroup, 'data', []).find(og => isGlobal(og)).metadata.namespace;
      }

      return {
        targetNamespace,
        installMode: prevState.installMode || installMode,
        updateChannel: prevState.updateChannel || updateChannel,
        approval: prevState.approval || InstallPlanApproval.Automatic,
      };
    }

    render() {
      return <Component {...this.props} updateFormState={(state) => this.setState(state)} formState={() => this.state} />;
    }
  };
};

export const OperatorHubSubscribeForm = withFormState((props: OperatorHubSubscribeFormProps) => {
  if (!props.packageManifest.loaded) {
    return <LoadingBox />;
  }

  const {provider, channels = [], packageName} = props.packageManifest.data.status;
  const srcProvider = _.get(props.packageManifest.data, 'metadata.labels.opsrc-provider', 'custom');
  const providerType = getOperatorProviderType(props.packageManifest.data);

  const submit = () => {
    const OPERATOR_HUB_CSC_NAME = `${OPERATOR_HUB_CSC_BASE}-${srcProvider}-${props.formState().targetNamespace}`;
    const catalogSourceConfig = props.catalogSourceConfig.data.find(csc => csc.metadata.name === OPERATOR_HUB_CSC_NAME);
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
        targetNamespace: props.formState().targetNamespace,
        packages: `${packages}`,
        csDisplayName: `${providerType} Operators`,
        csPublisher: `${providerType}`,
      },
    };

    const operatorGroup: OperatorGroupKind = {
      apiVersion: apiVersionForModel(OperatorGroupModel) as OperatorGroupKind['apiVersion'],
      kind: 'OperatorGroup',
      metadata: {
        generateName: `${props.formState().targetNamespace}-`,
        namespace: props.formState().targetNamespace,
      },
      spec: {
        targetNamespaces: [props.formState().targetNamespace],
      },
    };

    const subscription: SubscriptionKind = {
      apiVersion: apiVersionForModel(SubscriptionModel) as SubscriptionKind['apiVersion'],
      kind: 'Subscription',
      metadata: {
        name: packageName,
        namespace: props.formState().targetNamespace,
        labels: {
          'csc-owner-name': OPERATOR_HUB_CSC_NAME,
          'csc-owner-namespace': 'openshift-marketplace',
        },
      },
      spec: {
        source: OPERATOR_HUB_CSC_NAME,
        sourceNamespace: props.formState().targetNamespace,
        name: packageName,
        startingCSV: channels.find(ch => ch.name === props.formState().updateChannel).currentCSV,
        channel: props.formState().updateChannel,
        installPlanApproval: props.formState().approval,
      },
    };

    // TODO(alecmerdler): Handle and display error from creating kube objects...
    return (!_.isEmpty(catalogSourceConfig) || hasBeenEnabled
      ? k8sUpdate(CatalogSourceConfigModel, {...catalogSourceConfig, spec: {...catalogSourceConfig.spec, packages}}, 'openshift-marketplace', OPERATOR_HUB_CSC_NAME)
      : k8sCreate(CatalogSourceConfigModel, newCatalogSourceConfig)
    ).then(() => props.operatorGroup.data.some(group => group.metadata.namespace === props.formState().targetNamespace)
      ? Promise.resolve()
      : k8sCreate(OperatorGroupModel, operatorGroup))
      .then(() => k8sCreate(SubscriptionModel, subscription))
      .then(() => history.push(resourcePathFromModel(SubscriptionModel, packageName, subscription.metadata.namespace)));
  };

  const installModes = channels.find(ch => ch.name === props.formState().updateChannel).currentCSVDesc.installModes;
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
  const subscriptionExists = (ns: string) => installedFor(props.subscription.data)(props.operatorGroup.data)(props.packageManifest.data.status.packageName)(ns);
  const namespaceSupports = (ns: string) => (mode: InstallModeType) => {
    const operatorGroup = props.operatorGroup.data.find(og => og.metadata.namespace === ns);
    if (!operatorGroup || !ns) {
      return true;
    }
    return supports([{type: mode, supported: true}])(operatorGroup);
  };

  return <React.Fragment>
    <div className="col-xs-6">
      <React.Fragment>
        <div className="form-group">
          <label className="co-required">Installation Mode</label>
          <div>
            <Tooltip content={descFor(InstallModeType.InstallModeTypeAllNamespaces)} hidden={!supportsGlobal}>
              <RadioInput
                onChange={e => props.updateFormState({installMode: e.target.value, targetNamespace: null})}
                value={InstallModeType.InstallModeTypeAllNamespaces}
                checked={props.formState().installMode === InstallModeType.InstallModeTypeAllNamespaces}
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
                onChange={e => props.updateFormState({installMode: e.target.value, targetNamespace: null})}
                value={InstallModeType.InstallModeTypeSingleNamespace}
                checked={props.formState().installMode === InstallModeType.InstallModeTypeSingleNamespace}
                disabled={!supportsSingle}
                title="A specific namespace on the cluster">
                <div className="co-m-radio-desc">
                  <p className="text-muted">{descFor(InstallModeType.InstallModeTypeSingleNamespace)}</p>
                </div>
                { props.formState().installMode === InstallModeType.InstallModeTypeSingleNamespace && <div style={{marginLeft: '20px'}}>
                  <NsDropdown
                    id="dropdown-selectbox"
                    selectedKey={props.formState().targetNamespace}
                    // TODO(alecmerdler): We can check the `olm.providedAPIs` annotation to filter instead (when it's implemented)!
                    onChange={(ns: string) => props.updateFormState({targetNamespace: ns})} />
                </div> }
              </RadioInput>
            </Tooltip>
          </div>
        </div>
        <div className="form-group">
          <label className="co-required">Update Channel</label>
          <RadioGroup
            currentValue={props.formState().updateChannel}
            items={channels.map(ch => ({value: ch.name, title: ch.name}))}
            onChange={(e) => props.updateFormState({updateChannel: e.currentTarget.value, installMode: null, targetNamespace: null})} />
        </div>
        <div className="form-group">
          <label className="co-required">Approval Strategy</label>
          <RadioGroup
            currentValue={props.formState().approval}
            items={[
              {value: InstallPlanApproval.Automatic, title: 'Automatic'},
              {value: InstallPlanApproval.Manual, title: 'Manual'},
            ]}
            onChange={(e) => props.updateFormState({approval: e.currentTarget.value})} />
        </div>
      </React.Fragment>
      <div className="co-form-section__separator" />
      { !namespaceSupports(props.formState().targetNamespace)(props.formState().installMode) && <Alert type="error">Namespace does not support install modes for this Operator.</Alert> }
      { subscriptionExists(props.formState().targetNamespace) && <Alert type="error">Operator subscription for namespace &quot;{props.formState().targetNamespace}&quot; already exists.</Alert> }
      <React.Fragment>
        <button
          className="btn btn-primary"
          onClick={() => submit()}
          disabled={_.values(props.formState()).some(v => _.isNil(v))
            || subscriptionExists(props.formState().targetNamespace)
            || !namespaceSupports(props.formState().targetNamespace)(props.formState().installMode)}>
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
});

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

type FormData = {
  targetNamespace?: string;
  installMode?: InstallModeType;
  updateChannel?: string;
  approval?: InstallPlanApproval;
};

type WithFormStateProps = {
  updateFormState: (state: FormData) => void;
  formState: () => FormData;
};

export type OperatorHubSubscribeFormProps = {
  loaded: boolean;
  loadError?: any;
  namespace: string;
  operatorGroup: {loaded: boolean, data: OperatorGroupKind[]};
  packageManifest: {loaded: boolean, data: PackageManifestKind};
  catalogSourceConfig: {loaded: boolean, data: K8sResourceKind[]};
  subscription: {loaded: boolean, data: SubscriptionKind[]};
  updateFormState: (state: FormData) => void;
  formState: () => FormData;
};

export type OperatorHubSubscribePageProps = {

};

OperatorHubSubscribePage.displayName = 'OperatorHubSubscribePage';
