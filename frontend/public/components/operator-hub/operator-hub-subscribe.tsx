/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';

import { Firehose, LoadingBox, history } from '../utils';
import { referenceForModel, K8sResourceKind, k8sUpdate, k8sCreate } from '../../module/k8s';
import { SubscriptionModel, CatalogSourceConfigModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import { OperatorGroupKind, PackageManifestKind, ClusterServiceVersionLogo, SubscriptionKind, InstallPlanApproval } from '../operator-lifecycle-manager';
import { OperatorGroupSelector } from '../operator-lifecycle-manager/operator-group';
import { RadioGroup } from '../radio';
import { OPERATOR_HUB_CSC_BASE } from './index';

// TODO: Use `redux-form` instead of stateful component
const withFormState = (Component) => {
  /**
   * Controlled component which holds form state (https://reactjs.org/docs/forms.html#controlled-components).
   */
  return class WithFormState extends React.Component {
    static WrappedComponent = Component;

    state = {
      target: null,
      updateChannel: null,
      approval: InstallPlanApproval.Automatic,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
      const updateChannel = !_.isEmpty(_.get(nextProps.packageManifest, 'data'))
        ? (nextProps.packageManifest.data.status.channels.find(ch => ch.name === nextProps.packageManifest.data.status.defaultChannel) || nextProps.packageManifest.data.status.channels[0]).name
        : null;

      return {
        target: prevState.target,
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

  const submit = () => {
    const operatorGroupNamespace = props.operatorGroup.data.find(og => og.metadata.name === props.formState().target).metadata.namespace;
    const OPERATOR_HUB_CSC_NAME = `${OPERATOR_HUB_CSC_BASE}-${operatorGroupNamespace}`;

    const catalogSourceConfig = props.catalogSourceConfig.data.find(csc => csc.metadata.name === OPERATOR_HUB_CSC_NAME);
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
        targetNamespace: operatorGroupNamespace,
        packages: `${packages}`,
      },
    };

    const subscription: SubscriptionKind = {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'Subscription',
      metadata: {
        name: packageName,
        namespace: props.operatorGroup.data.find(og => og.metadata.name === props.formState().target).metadata.namespace,
      },
      spec: {
        source: OPERATOR_HUB_CSC_NAME,
        sourceNamespace: operatorGroupNamespace,
        name: packageName,
        startingCSV: channels.find(ch => ch.name === props.formState().updateChannel).currentCSV,
        channel: props.formState().updateChannel,
        installPlanApproval: props.formState().approval,
      },
    };

    return (!_.isEmpty(catalogSourceConfig)
      ? k8sUpdate(CatalogSourceConfigModel, {...catalogSourceConfig, spec: {targetNamespace: operatorGroupNamespace, packages}}, 'openshift-marketplace', OPERATOR_HUB_CSC_NAME)
      : k8sCreate(CatalogSourceConfigModel, newCatalogSourceConfig)
    ).then(() => k8sCreate(SubscriptionModel, subscription))
      .then(() => history.push('/operatorhub'));
  };

  return <div>
    <div className="col-xs-6">
      <div>
        <div className="form-group">
          <label className="co-required">Target</label>
          <OperatorGroupSelector onChange={(target) => props.updateFormState({target})} excludeName={'olm-operators'} />
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
      </div>
      <div className="co-form-section__separator"></div>
      <div>
        <button className="btn btn-primary" onClick={() => submit()} disabled={_.values(props.formState()).some(v => _.isNil(v))}>Subscribe</button>
        <button className="btn btn-default" onClick={() => history.push('/operatorhub')}>Cancel</button>
      </div>
    </div>
    <div className="col-xs-6">
      <ClusterServiceVersionLogo displayName={_.get(channels, '[0].currentCSVDesc.displayName')} icon={_.get(channels, '[0].currentCSVDesc.icon[0]')} provider={provider} />
    </div>
  </div>;
});

export const OperatorHubSubscribePage: React.SFC<OperatorHubSubscribePageProps> = (props) => {
  return <div className="co-m-pane__body">
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
      selector: {matchLabels: {'openshift-marketplace':'true'}},
    }, {
      isList: true,
      kind: referenceForModel(SubscriptionModel),
      prop: 'subscription',
    }]}>
      {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
      <OperatorHubSubscribeForm {...props as any} />
    </Firehose>
  </div>;
};

export type OperatorHubSubscribeFormProps = {
  loaded: boolean;
  loadError?: any;
  operatorGroup: {loaded: boolean, data: OperatorGroupKind[]};
  packageManifest: {loaded: boolean, data: PackageManifestKind};
  catalogSourceConfig: {loaded: boolean, data: K8sResourceKind[]};
  subscription: {loaded: boolean, data: SubscriptionKind[]};
  updateFormState: (state: {target?: string, updateChannel?: string, approval?: string}) => void;
  formState: () => {target?: string, updateChannel?: string, approval?: InstallPlanApproval};
};

export type OperatorHubSubscribePageProps = {

};

OperatorHubSubscribePage.displayName = 'OperatorHubSubscribePage';
