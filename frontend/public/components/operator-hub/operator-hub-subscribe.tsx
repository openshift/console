/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Alert } from 'patternfly-react';

import { Firehose, LoadingBox, history, NsDropdown } from '../utils';
import { referenceForModel, K8sResourceKind, k8sUpdate, k8sCreate } from '../../module/k8s';
import { SubscriptionModel, CatalogSourceConfigModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import { OperatorGroupKind, PackageManifestKind, ClusterServiceVersionLogo, SubscriptionKind, InstallPlanApproval, installModesFor, defaultChannelFor } from '../operator-lifecycle-manager';
import { InstallModeType, isGlobal, installedFor, isSingle } from '../operator-lifecycle-manager/operator-group';
import { RadioGroup, RadioInput } from '../radio';
import { OPERATOR_HUB_CSC_BASE } from '../../const';
import { getOperatorProviderType } from './operator-hub-utils';
import { Tooltip } from '../utils/tooltip';

// TODO: Use `redux-form` instead of stateful component
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
      const installMode = !_.isEmpty(_.get(nextProps.packageManifest, 'data'))
        ? installModesFor(nextProps.packageManifest.data)(updateChannel)
          .filter(({supported}) => supported)
          .reduce((acc, mode) => mode.type === InstallModeType.InstallModeTypeAllNamespaces
            ? InstallModeType.InstallModeTypeAllNamespaces
            : acc,
          InstallModeType.InstallModeTypeOwnNamespace)
        : null;
      const targetNamespace = installMode === InstallModeType.InstallModeTypeOwnNamespace
        ? _.get(nextProps.operatorGroup, 'data', [])
          .some(group => group.metadata.namespace === nextProps.targetNamespace && !isSingle(group)) ? null : nextProps.targetNamespace
        : _.get(nextProps.operatorGroup, 'data', [])
          .reduce((ns, group) => isGlobal(group) ? group.metadata.namespace : ns, prevState.targetNamespace || nextProps.targetNamespace);

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
      apiVersion: `${CatalogSourceConfigModel.apiGroup}/${CatalogSourceConfigModel.apiVersion}`,
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
      apiVersion: 'operators.coreos.com/v1alpha2',
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
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'Subscription',
      metadata: {
        name: packageName,
        namespace: props.formState().targetNamespace,
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

    return (!_.isEmpty(catalogSourceConfig) || hasBeenEnabled
      ? k8sUpdate(CatalogSourceConfigModel, {...catalogSourceConfig, spec: {...catalogSourceConfig.spec, packages}}, 'openshift-marketplace', OPERATOR_HUB_CSC_NAME)
      : k8sCreate(CatalogSourceConfigModel, newCatalogSourceConfig)
    ).then(() => props.operatorGroup.data.some(group => group.metadata.namespace === props.formState().targetNamespace)
      ? Promise.resolve()
      : k8sCreate(OperatorGroupModel, operatorGroup))
      .then(() => k8sCreate(SubscriptionModel, subscription))
      .then(() => history.push('/operatorhub'));
  };

  const installModes = channels.find(ch => ch.name === props.formState().updateChannel).currentCSVDesc.installModes;
  const isGlobalOperator = installModes.find(m => m.type === InstallModeType.InstallModeTypeAllNamespaces).supported;
  const descFor = (mode: InstallModeType) => {
    if (mode === InstallModeType.InstallModeTypeAllNamespaces && isGlobalOperator) {
      return 'Operator will be available in all namespaces.';
    }
    if (mode === InstallModeType.InstallModeTypeOwnNamespace && !isGlobalOperator) {
      return 'Operator will be available in a single namespace only.';
    }
    return 'This mode is not supported by this Operator';
  };
  const subscriptionExists = (ns: string) => installedFor(props.subscription.data)(props.operatorGroup.data)(props.packageManifest.data.status.packageName)(ns);

  return <React.Fragment>
    <div className="col-xs-6">
      <React.Fragment>
        <div className="form-group">
          <label className="co-required">Installation Mode</label>
          <div>
            <Tooltip content={descFor(InstallModeType.InstallModeTypeAllNamespaces)} hidden={isGlobalOperator}>
              <RadioInput
                onChange={e => props.updateFormState({installMode: e.target.value})}
                value={InstallModeType.InstallModeTypeAllNamespaces}
                checked={props.formState().installMode === InstallModeType.InstallModeTypeAllNamespaces}
                disabled={!isGlobalOperator}
                title="All namespaces on the cluster"
                subTitle="(default)">
                <div className="co-m-radio-desc">
                  <p className="text-muted">{descFor(InstallModeType.InstallModeTypeAllNamespaces)}</p>
                </div>
              </RadioInput>
            </Tooltip>
          </div>
          <div>
            <Tooltip content={descFor(InstallModeType.InstallModeTypeOwnNamespace)} hidden={!isGlobalOperator}>
              <RadioInput
                onChange={e => props.updateFormState({installMode: e.target.value})}
                value={InstallModeType.InstallModeTypeOwnNamespace}
                checked={props.formState().installMode === InstallModeType.InstallModeTypeOwnNamespace}
                disabled={isGlobalOperator}
                title="A specific namespace on the cluster">
                <div className="co-m-radio-desc">
                  <p className="text-muted">{descFor(InstallModeType.InstallModeTypeOwnNamespace)}</p>
                </div>
                { props.formState().installMode !== InstallModeType.InstallModeTypeAllNamespaces && <div style={{marginLeft: '20px'}}>
                  <NsDropdown
                    id="dropdown-selectbox"
                    selectedKey={props.formState().targetNamespace}
                    dataFilter={(ns: K8sResourceKind) => _.isNil(props.operatorGroup.data.find(og => og.metadata.namespace === ns.metadata.name && !isSingle(og)))}
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
            onChange={(e) => props.updateFormState({updateChannel: e.currentTarget.value})} />
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
      { subscriptionExists(props.formState().targetNamespace) && <Alert type="error">Operator subscription in namespace &quot;{props.formState().targetNamespace}&quot; already exists</Alert> }
      <React.Fragment>
        <button className="btn btn-primary" onClick={() => submit()} disabled={_.values(props.formState()).some(v => _.isNil(v)) || subscriptionExists(props.formState().targetNamespace)}>
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
    <title>Operator Hub Subscription</title>
  </Helmet>
  <div>
    <h1>Create Operator Subscription</h1>
    <p className="co-help-text">Keep your service up to date by subscribing to a channel and update strategy from which to pull updates.</p>
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
