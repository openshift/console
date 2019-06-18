import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { match } from 'react-router';
import { Alert } from '@patternfly/react-core';

import { Firehose, history, NsDropdown, resourcePathFromModel, BreadCrumbs, StatusBox } from '../utils';
import { referenceForModel, k8sCreate, apiVersionForModel, kindForReference, apiVersionForReference, k8sListPartialMetadata } from '../../module/k8s';
import { SubscriptionModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import {
  OperatorGroupKind,
  PackageManifestKind,
  ClusterServiceVersionLogo,
  SubscriptionKind,
  InstallPlanApproval,
  defaultChannelFor,
  supportedInstallModesFor,
  providedAPIsForChannel,
  referenceForProvidedAPI,
} from '../operator-lifecycle-manager';
import { InstallModeType, installedFor, supports, providedAPIsFor, isGlobal } from '../operator-lifecycle-manager/operator-group';
import { RadioGroup, RadioInput } from '../radio';
import { Tooltip } from '../utils/tooltip';
import { CRDCard } from '../operator-lifecycle-manager/clusterserviceversion';
import { fromRequirements } from '../../module/k8s/selector';

export const OperatorHubSubscribeForm: React.FC<OperatorHubSubscribeFormProps> = (props) => {
  const [targetNamespace, setTargetNamespace] = React.useState(null);
  const [installMode, setInstallMode] = React.useState(null);
  const [updateChannel, setUpdateChannel] = React.useState(null);
  const [approval, setApproval] = React.useState(InstallPlanApproval.Automatic);
  const [cannotResolve, setCannotResolve] = React.useState(false);

  const {name: pkgName} = props.packageManifest.data[0].metadata;
  const {provider, channels = [], packageName, catalogSource, catalogSourceNamespace} = props.packageManifest.data[0].status;

  const selectedUpdateChannel = updateChannel || defaultChannelFor(props.packageManifest.data[0]);
  const selectedInstallMode = installMode || supportedInstallModesFor(props.packageManifest.data[0])(selectedUpdateChannel)
    .reduce((preferredInstallMode, mode) => mode.type === InstallModeType.InstallModeTypeAllNamespaces
      ? InstallModeType.InstallModeTypeAllNamespaces
      : preferredInstallMode, InstallModeType.InstallModeTypeOwnNamespace);
  let selectedTargetNamespace = targetNamespace || props.targetNamespace;
  if (selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces) {
    selectedTargetNamespace = _.get(props.operatorGroup, 'data', [] as OperatorGroupKind[]).find(og => og.metadata.name === 'global-operators').metadata.namespace;
  }
  const selectedApproval = approval || InstallPlanApproval.Automatic;

  React.useEffect(() => {
    if (selectedTargetNamespace) {
      k8sListPartialMetadata(PackageManifestModel, {
        ns: selectedTargetNamespace,
        fieldSelector: `metadata.name=${pkgName}`,
        labelSelector: fromRequirements([
          {key: 'catalog', operator: 'Equals', values: [catalogSource]},
          {key: 'catalog-namespace', operator: 'Equals', values: [catalogSourceNamespace]},
        ]),
      }).then((list) => setCannotResolve(_.isEmpty(list)))
        .catch(() => setCannotResolve(true));
    }
  }, [catalogSource, catalogSourceNamespace, pkgName, props.packageManifest.data, selectedTargetNamespace]);

  const installModes = channels.find(ch => ch.name === selectedUpdateChannel).currentCSVDesc.installModes;
  const supportsSingle = installModes.find(m => m.type === InstallModeType.InstallModeTypeOwnNamespace).supported;
  const supportsGlobal = installModes.find(m => m.type === InstallModeType.InstallModeTypeAllNamespaces).supported;
  const descFor = (mode: InstallModeType) => {
    if (mode === InstallModeType.InstallModeTypeAllNamespaces && supportsGlobal) {
      return 'Operator will be available in all namespaces.';
    }
    if (mode === InstallModeType.InstallModeTypeOwnNamespace && supportsSingle) {
      return 'Operator will be available in a single namespace only.';
    }
    return 'This mode is not supported by this Operator';
  };
  const subscriptionExists = (ns: string) => installedFor(props.subscription.data)(props.operatorGroup.data)(props.packageManifest.data[0].status.packageName)(ns);
  const namespaceSupports = (ns: string) => (mode: InstallModeType) => {
    const operatorGroup = props.operatorGroup.data.find(og => og.metadata.namespace === ns);
    if (!operatorGroup || !ns) {
      return true;
    }
    return supports([{type: mode, supported: true}])(operatorGroup);
  };
  const conflictingProvidedAPIs = (ns: string) => {
    const operatorGroups = props.operatorGroup.data.filter(og => og.status.namespaces.includes(ns) || isGlobal(og));
    if (_.isEmpty(operatorGroups)) {
      return [];
    }
    const existingAPIs = _.flatMap(operatorGroups, providedAPIsFor);
    const providedAPIs = providedAPIsForChannel(props.packageManifest.data[0])(selectedUpdateChannel).map(desc => referenceForProvidedAPI(desc));

    return _.intersection(existingAPIs, providedAPIs);
  };

  const submit = () => {
    const operatorGroup: OperatorGroupKind = {
      apiVersion: apiVersionForModel(OperatorGroupModel) as OperatorGroupKind['apiVersion'],
      kind: 'OperatorGroup',
      metadata: {
        generateName: `${selectedTargetNamespace}-`,
        namespace: selectedTargetNamespace,
      },
      spec: {
        targetNamespaces: [selectedTargetNamespace],
      },
    };

    const subscription: SubscriptionKind = {
      apiVersion: apiVersionForModel(SubscriptionModel) as SubscriptionKind['apiVersion'],
      kind: 'Subscription',
      metadata: {
        name: packageName,
        namespace: selectedTargetNamespace,
      },
      spec: {
        source: catalogSource,
        sourceNamespace: catalogSourceNamespace,
        name: packageName,
        startingCSV: channels.find(ch => ch.name === selectedUpdateChannel).currentCSV,
        channel: selectedUpdateChannel,
        installPlanApproval: selectedApproval,
      },
    };

    // TODO(alecmerdler): Handle and display error from creating kube objects...
    return (props.operatorGroup.data.some(group => group.metadata.namespace === selectedTargetNamespace)
      ? Promise.resolve()
      : k8sCreate(OperatorGroupModel, operatorGroup))
      .then(() => k8sCreate(SubscriptionModel, subscription))
      .then(() => history.push(resourcePathFromModel(SubscriptionModel, packageName, subscription.metadata.namespace)));
  };

  const formValid = () => [selectedUpdateChannel, selectedInstallMode, selectedTargetNamespace, selectedApproval].some(v => _.isNil(v) || _.isEmpty(v))
    || subscriptionExists(selectedTargetNamespace)
    || !namespaceSupports(selectedTargetNamespace)(selectedInstallMode)
    || (selectedTargetNamespace && cannotResolve)
    || !_.isEmpty(conflictingProvidedAPIs(selectedTargetNamespace));

  const formError = () => {
    return !namespaceSupports(selectedTargetNamespace)(selectedInstallMode) && <Alert isInline className="co-alert" variant="danger" title="Namespace does not support install modes for this Operator." />
      || subscriptionExists(selectedTargetNamespace) && <Alert isInline className="co-alert" variant="danger" title={`Operator subscription for namespace &quot;${selectedTargetNamespace}&quot; already exists.`} />
      || !_.isEmpty(conflictingProvidedAPIs(selectedTargetNamespace)) && <Alert
        isInline
        className="co-alert"
        variant="danger"
        title="Operator conflicts exist"
      >
        Installing Operator in selected namespace would cause conflicts with another Operator providing these APIs:
        <ul>{conflictingProvidedAPIs(selectedTargetNamespace).map(gvk => <li key={gvk}><strong>{kindForReference(gvk)}</strong> <i>({apiVersionForReference(gvk)})</i></li>)}</ul>
      </Alert>
      || (selectedTargetNamespace && cannotResolve) && <Alert isInline className="co-alert" variant="danger" title="Operator not available for selected namespace(s)" />;
  };

  return <React.Fragment>
    <div className="col-xs-6">
      <React.Fragment>
        <div className="form-group">
          <label className="co-required">Installation Mode</label>
          <div>
            <Tooltip content={descFor(InstallModeType.InstallModeTypeAllNamespaces)} hidden={!supportsGlobal}>
              <RadioInput
                onChange={e => {
                  setInstallMode(e.target.value);
                  setTargetNamespace(null);
                  setCannotResolve(false);
                }}
                value={InstallModeType.InstallModeTypeAllNamespaces}
                checked={selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces}
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
            <Tooltip content={descFor(InstallModeType.InstallModeTypeOwnNamespace)} hidden={!supportsSingle}>
              <RadioInput
                onChange={e => {
                  setInstallMode(e.target.value);
                  setTargetNamespace(null);
                  setCannotResolve(false);
                }}
                value={InstallModeType.InstallModeTypeOwnNamespace}
                checked={selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace}
                disabled={!supportsSingle}
                title="A specific namespace on the cluster">
                <div className="co-m-radio-desc">
                  <p className="text-muted">{descFor(InstallModeType.InstallModeTypeOwnNamespace)}</p>
                </div>
                { selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace && <div style={{marginLeft: '20px'}}>
                  <NsDropdown
                    id="dropdown-selectbox"
                    selectedKey={selectedTargetNamespace}
                    onChange={(ns: string) => {
                      setTargetNamespace(ns);
                      setCannotResolve(false);
                    }} />
                </div> }
              </RadioInput>
            </Tooltip>
          </div>
        </div>
        <div className="form-group">
          <Tooltip content="The channel to track and receive the updates from.">
            <label className="co-required">Update Channel</label>
          </Tooltip>
          <RadioGroup
            currentValue={selectedUpdateChannel}
            items={channels.map(ch => ({value: ch.name, title: ch.name}))}
            onChange={(e) => {
              setUpdateChannel(e.currentTarget.value);
              setInstallMode(null);
              setTargetNamespace(null);
              setCannotResolve(false);
            }} />
        </div>
        <div className="form-group">
          <Tooltip content="The strategy to determine either manual or automatic updates.">
            <label className="co-required">Approval Strategy</label>
          </Tooltip>
          <RadioGroup
            currentValue={selectedApproval}
            items={[
              {value: InstallPlanApproval.Automatic, title: 'Automatic'},
              {value: InstallPlanApproval.Manual, title: 'Manual'},
            ]}
            onChange={(e) => setApproval(e.currentTarget.value)} />
        </div>
      </React.Fragment>
      <div className="co-form-section__separator" />
      { formError() }
      <React.Fragment>
        <button
          className="btn btn-primary"
          onClick={() => submit()}
          disabled={formValid()}>
          Subscribe
        </button>
        <button className="btn btn-default" onClick={() => history.push('/operatorhub')}>
          Cancel
        </button>
      </React.Fragment>
    </div>
    <div className="col-xs-6">
      <ClusterServiceVersionLogo displayName={_.get(channels, '[0].currentCSVDesc.displayName')} icon={_.get(channels, '[0].currentCSVDesc.icon[0]')} provider={provider} />
      <h4>Provided APIs</h4>
      <div className="co-crd-card-row">
        { _.isEmpty(providedAPIsForChannel(props.packageManifest.data[0])(selectedUpdateChannel))
          ? <span className="text-muted">No Kubernetes APIs are provided by this Operator.</span>
          : providedAPIsForChannel(props.packageManifest.data[0])(selectedUpdateChannel).map(api =>
            <CRDCard key={referenceForProvidedAPI(api)} canCreate={false} crd={api} csv={null} />) }
      </div>
    </div>
  </React.Fragment>;
};

const OperatorHubSubscribe: React.FC<OperatorHubSubscribeFormProps> = (props) => <StatusBox data={props.packageManifest.data[0]} loaded={props.loaded} loadError={props.loadError}>
  <OperatorHubSubscribeForm {...props} />
</StatusBox>;

export const OperatorHubSubscribePage: React.SFC<OperatorHubSubscribePageProps> = (props) => {
  const search = new URLSearchParams({
    'details-item': `${new URLSearchParams(window.location.search).get('pkg')}-${new URLSearchParams(window.location.search).get('catalogNamespace')}`,
  });

  return <div className="co-m-pane__body" style={{margin: 0}}>
    <Helmet>
      <title>OperatorHub Subscription</title>
    </Helmet>
    <div>
      <BreadCrumbs breadcrumbs={[
        {name: 'OperatorHub', path: `/operatorhub?${search.toString()}`},
        {name: 'Operator Subscription', path: props.match.url},
      ]} />
      <h1>Create Operator Subscription</h1>
      <p className="co-help-text">
        Install your Operator by subscribing to one of the update channels to keep the Operator up to date. The strategy determines either manual or automatic updates.
      </p>
    </div>
    <Firehose resources={[{
      isList: true,
      kind: referenceForModel(OperatorGroupModel),
      prop: 'operatorGroup',
    }, {
      isList: true,
      kind: referenceForModel(PackageManifestModel),
      namespace: new URLSearchParams(window.location.search).get('catalogNamespace'),
      fieldSelector: `metadata.name=${new URLSearchParams(window.location.search).get('pkg')}`,
      selector: {matchLabels: {catalog: new URLSearchParams(window.location.search).get('catalog')}},
      prop: 'packageManifest',
    }, {
      isList: true,
      kind: referenceForModel(SubscriptionModel),
      prop: 'subscription',
    }]}>
      {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
      <OperatorHubSubscribe {...props as any} targetNamespace={new URLSearchParams(window.location.search).get('targetNamespace') || null} />
    </Firehose>
  </div>;
};

export type OperatorHubSubscribeFormProps = {
  loaded: boolean;
  loadError?: any;
  namespace: string;
  targetNamespace?: string;
  operatorGroup: {loaded: boolean, data: OperatorGroupKind[]};
  packageManifest: {loaded: boolean, data: PackageManifestKind[]};
  subscription: {loaded: boolean, data: SubscriptionKind[]};
};

export type OperatorHubSubscribePageProps = {
  match: match;
};

OperatorHubSubscribe.displayName = 'OperatorHubSubscribe';
OperatorHubSubscribeForm.displayName = 'OperatorHubSubscribeForm';
OperatorHubSubscribePage.displayName = 'OperatorHubSubscribePage';
