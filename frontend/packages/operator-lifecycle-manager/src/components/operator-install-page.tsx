import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ClusterServiceVersionLogo, iconFor } from './index';
import {
  ActionGroup,
  Alert,
  Bullseye,
  Button,
  Card,
  CardBody,
  Spinner,
} from '@patternfly/react-core';
import {
  Firehose,
  FirehoseResult,
  ResourceLink,
  ResourceStatus,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { k8sPatch, modelFor, referenceForModel, referenceFor } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import {
  ClusterServiceVersionModel,
  InstallPlanModel,
  PackageManifestModel,
  SubscriptionModel,
} from '../models';
import {
  ClusterServiceVersionKind,
  SubscriptionKind,
  InstallPlanKind,
  PackageManifestKind,
} from '../types';
import { StatusIconAndText } from '@console/shared';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import { InstallPlanPreview } from './install-plan';

const getInitializationResourceJSON = (
  obj: ClusterServiceVersionKind | InstallPlanKind | SubscriptionKind,
) => {
  return obj?.metadata?.annotations?.['operatorframework.io/initialization-resource'];
};

const ViewInstalledOperatorsButton: React.FC<ViewOperatorButtonProps> = ({ namespace }) => (
  <div className="co-operator-install-page__link">
    <Link
      data-test="view-installed-operators-btn"
      to={resourcePathFromModel(ClusterServiceVersionModel, null, namespace)}
    >
      View Installed Operators in{' '}
      {namespace ? (
        <>
          namespace <b>{namespace}</b>
        </>
      ) : (
        <b>all namespaces</b>
      )}
    </Link>
  </div>
);

const InstallFailedMessage: React.FC<InstallFailedMessageProps> = ({ namespace, csvName, obj }) => {
  const initializationResourceMessage = getInitializationResourceJSON(obj)
    ? "The required custom resource can be created in the Operator's details view."
    : '';

  return (
    <>
      <h2 className="co-clusterserviceversion-install__heading">Operator installation failed</h2>
      <p>The operator did not install successfully. {initializationResourceMessage}</p>
      <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
        <Link to={resourcePathFromModel(ClusterServiceVersionModel, csvName, namespace)}>
          <Button variant="primary">View Error</Button>
        </Link>
        <ViewInstalledOperatorsButton namespace={namespace} />
      </ActionGroup>
    </>
  );
};

const InstallNeedsApprovalMessage: React.FC<InstallNeedsApprovalMessageProps> = ({
  namespace,
  obj,
  approve,
}) => (
  <>
    <h2 className="co-clusterserviceversion-install__heading">Manual approval required</h2>
    <p>
      Review the manual install plan. Once approved, the following resources will be created in
      order to satisfy the requirements for the components specified in the plan. Click the resource
      name to view the resource in detail.
    </p>
    <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
      <Button variant="primary" onClick={approve}>
        Approve
      </Button>
      <Link
        to={`${resourcePathFromModel(
          SubscriptionModel,
          obj?.metadata?.name,
          namespace,
        )}?showDelete=true`}
      >
        <Button className="co-clusterserviceversion__button" variant="secondary">
          Deny
        </Button>
      </Link>
      <ViewInstalledOperatorsButton namespace={namespace} />
    </ActionGroup>
  </>
);

export const CreateInitializationResourceButton: React.FC<InitializationResourceButtonProps> = ({
  obj,
  disabled,
  targetNamespace,
}) => {
  if (!getInitializationResourceJSON(obj)) {
    return null;
  }
  let initializationResource = null;
  try {
    initializationResource = JSON.parse(getInitializationResourceJSON(obj));
  } catch (error) {
    const errorMsg = error.message;
    errorModal({ errorMsg });
  }
  const reference = referenceFor(initializationResource);
  const model = modelFor(reference);
  const initializationResourceNamespace = model?.namespaced
    ? initializationResource?.metadata?.namespace || targetNamespace
    : null;
  const kind = initializationResource?.kind;
  return (
    <Link
      to={`${resourcePathFromModel(
        ClusterServiceVersionModel,
        obj.metadata.name,
        initializationResourceNamespace,
      )}/${reference}/~new`}
    >
      <Button isDisabled={disabled} variant="primary">
        Create {kind}
      </Button>
    </Link>
  );
};

const InitializationResourceRequiredMessage: React.FC<InitializationResourceRequiredMessageProps> = ({
  obj,
}) => {
  if (!getInitializationResourceJSON(obj)) {
    return null;
  }
  let initializationResource = null;
  try {
    initializationResource = JSON.parse(getInitializationResourceJSON(obj));
  } catch (error) {
    const errorMsg = error.message;
    errorModal({ errorMsg });
  }
  const initializationResourceKind = initializationResource?.kind;
  const initializationResourceNamespace = initializationResource?.metadata?.namespace;
  const description = obj?.metadata?.annotations?.description;
  return (
    <div className="co-clusterserviceversion__box">
      <span className="co-resource-item">
        <ResourceLink
          kind={initializationResourceKind}
          name={initializationResourceKind}
          namepace={initializationResourceNamespace}
        />
        <ResourceStatus badgeAlt>
          <StatusIconAndText icon={<RedExclamationCircleIcon />} title="Required" />
        </ResourceStatus>
      </span>
      <p>{description}</p>
    </div>
  );
};

const InstallSucceededMessage: React.FC<InstallSuccededMessageProps> = ({
  namespace,
  csvName,
  obj,
}) => {
  const initializationResourceMessage = getInitializationResourceJSON(obj)
    ? 'The operator has installed successfully. Create the required custom resource to be able to use this operator.'
    : '';
  return (
    <>
      <h2 className="co-clusterserviceversion-install__heading">
        Installed operator - ready for use
      </h2>
      <span>{initializationResourceMessage}</span>
      <InitializationResourceRequiredMessage obj={obj} />
      <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
        {!getInitializationResourceJSON(obj) && (
          <Link to={resourcePathFromModel(ClusterServiceVersionModel, csvName, namespace)}>
            <Button variant="primary">View Operator</Button>
          </Link>
        )}
        <CreateInitializationResourceButton obj={obj} targetNamespace={namespace} />
        <ViewInstalledOperatorsButton namespace={namespace} />
      </ActionGroup>
    </>
  );
};
const InstallingMessage: React.FC<InstallingMessageProps> = ({ namespace, obj }) => {
  const reason = (obj as ClusterServiceVersionKind)?.status?.reason || '';
  const message = (obj as ClusterServiceVersionKind)?.status?.message || '';
  const initializationResourceMessage = getInitializationResourceJSON(obj)
    ? 'Once the operator is installed the required custom resource will be available for creation.'
    : '';
  const installMessage = `The operator is being installed. This may take a few minutes. ${initializationResourceMessage}`;
  return (
    <>
      <h2 className="co-clusterserviceversion-install__heading">Installing operator</h2>
      {reason && (
        <div className="text-muted">
          {reason}: {message}
        </div>
      )}
      <p>{installMessage}</p>
      <InitializationResourceRequiredMessage obj={obj} />
      <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
        {getInitializationResourceJSON(obj) && (
          <CreateInitializationResourceButton obj={obj} targetNamespace={namespace} disabled />
        )}
        <ViewInstalledOperatorsButton namespace={namespace} />
      </ActionGroup>
    </>
  );
};

const OperatorInstallStatus: React.FC<OperatorInstallPageProps> = (props) => {
  const { resources, targetNamespace, pkgNameWithVersion } = props;

  let loading = true;
  let status = '';
  let installObj: ClusterServiceVersionKind | InstallPlanKind =
    resources?.clusterServiceVersions?.data;
  const subscription = resources?.subscription?.data;
  status = installObj?.status?.phase;
  if (installObj && status) {
    loading = false;
  } else if (subscription) {
    // There is no ClusterServiceVersion for the package, so look at Subscriptions/InstallPlans
    status = subscription?.status?.state || null;
    const installPlanName = subscription?.status?.installplan?.name || '';
    const installPlan: InstallPlanKind = resources?.installPlan?.data?.find(
      (ip) => ip.metadata.name === installPlanName,
    );
    if (installPlan) {
      installObj = installPlan;
      loading = false;
    }
  }

  const isStatusSucceeded = status === 'Succeeded';
  const isStatusFailed = status === 'Failed';
  const isApprovalNeeded =
    installObj?.spec?.approval === 'Manual' && installObj?.spec?.approved === false;

  const approve = () => {
    k8sPatch(InstallPlanModel, installObj, [
      { op: 'replace', path: '/spec/approved', value: true },
    ]).catch((error) => {
      const errorMsg = error.message;
      errorModal({ errorMsg });
    });
  };

  let indicator = <Spinner size="lg" />;
  if (isStatusFailed) {
    indicator = <RedExclamationCircleIcon size="lg" />;
  }
  if (isApprovalNeeded) {
    indicator = <YellowExclamationTriangleIcon size="lg" />;
  }
  if (isStatusSucceeded) {
    indicator = <GreenCheckCircleIcon size="lg" />;
  }

  let installMessage = <InstallingMessage namespace={targetNamespace} obj={installObj} />;
  if (isStatusFailed) {
    installMessage = (
      <InstallFailedMessage
        namespace={targetNamespace}
        obj={installObj}
        csvName={pkgNameWithVersion}
      />
    );
  } else if (isApprovalNeeded) {
    installMessage = (
      <InstallNeedsApprovalMessage
        namespace={targetNamespace}
        obj={subscription}
        approve={approve}
      />
    );
  } else if (isStatusSucceeded) {
    installMessage = (
      <InstallSucceededMessage
        namespace={targetNamespace}
        csvName={pkgNameWithVersion}
        obj={installObj}
      />
    );
  }

  const pkgManifest = resources.packageManifest.data[0];
  const channels = pkgManifest.status?.channels || [];
  const channel = channels.find((ch) => ch.currentCSV === pkgNameWithVersion) || channels[0];
  const displayName = channel?.currentCSVDesc?.displayName || '';
  const logoVersion = channel?.currentCSVDesc?.version || '';

  const CSVLogo = (
    <ClusterServiceVersionLogo
      displayName={displayName}
      icon={iconFor(pkgManifest)}
      provider={pkgManifest.status?.provider?.name || ''}
      version={logoVersion}
    />
  );

  return (
    <>
      <div className="co-operator-install-page__main">
        <Helmet>
          <title>Installing Operator</title>
        </Helmet>
        <Bullseye>
          <div id="operator-install-page">
            {loading && (
              <div>
                Installing... <Spinner size="lg" />
              </div>
            )}
            {!loading && isStatusFailed && (
              <Alert variant="danger" isInline title="Installation Failed">
                {status}: {(installObj as ClusterServiceVersionKind)?.status?.message || ''}
              </Alert>
            )}
            {!loading && (
              <Card>
                <CardBody>
                  <div className="co-operator-install-page__pkg-indicator">
                    <div>{CSVLogo}</div>
                    <div>{indicator}</div>
                  </div>
                </CardBody>
              </Card>
            )}
            {!loading && (
              <Card>
                <CardBody>{installMessage}</CardBody>
              </Card>
            )}
          </div>
        </Bullseye>
      </div>
      {!loading && isApprovalNeeded && (
        <InstallPlanPreview obj={installObj as InstallPlanKind} hideApprovalBlock />
      )}
    </>
  );
};

export const OperatorInstallStatusPage: React.FC<OperatorInstallPageProps> = (props) => {
  const { pkgNameWithVersion, targetNamespace } = props;
  const namespace = targetNamespace;
  const pkg = new URLSearchParams(window.location.search).get('pkg');
  const installPageResources = [
    {
      kind: referenceForModel(ClusterServiceVersionModel),
      namespaced: true,
      isList: false,
      name: pkgNameWithVersion,
      namespace,
      prop: 'clusterServiceVersions',
    },
    {
      kind: referenceForModel(SubscriptionModel),
      namespaced: true,
      isList: false,
      name: pkg,
      namespace,
      optional: true,
      prop: 'subscription',
    },
    {
      kind: referenceForModel(InstallPlanModel),
      prop: 'installPlan',
      namespaced: true,
      namespace,
      isList: true,
      optional: true,
    },
    {
      isList: true,
      kind: referenceForModel(PackageManifestModel),
      namespace: new URLSearchParams(window.location.search).get('catalogNamespace'),
      fieldSelector: `metadata.name=${pkg}`,
      selector: {
        matchLabels: {
          catalog: new URLSearchParams(window.location.search).get('catalog'),
        },
      },
      prop: 'packageManifest',
    },
  ];

  return (
    <Firehose resources={installPageResources}>
      <OperatorInstallStatus {...props} />
    </Firehose>
  );
};

export type OperatorInstallPageProps = {
  targetNamespace: string;
  pkgNameWithVersion: string;
  resources?: OperatorResources;
};

type InstallSuccededMessageProps = {
  namespace: string;
  obj: ClusterServiceVersionKind | InstallPlanKind;
  csvName: string;
};
type InstallNeedsApprovalMessageProps = {
  namespace: string;
  obj: SubscriptionKind;
  approve: () => void;
};
type InstallingMessageProps = {
  namespace: string;
  obj: ClusterServiceVersionKind | InstallPlanKind;
};
type InstallFailedMessageProps = {
  namespace: string;
  obj: ClusterServiceVersionKind | InstallPlanKind;
  csvName: string;
};
type InitializationResourceRequiredMessageProps = {
  obj: ClusterServiceVersionKind | InstallPlanKind;
};
type InitializationResourceButtonProps = {
  obj: ClusterServiceVersionKind | InstallPlanKind | SubscriptionKind;
  disabled?: boolean;
  targetNamespace: string;
};
type ViewOperatorButtonProps = {
  namespace: string;
};
export interface OperatorResources {
  clusterServiceVersions: FirehoseResult<ClusterServiceVersionKind>;
  subscription: FirehoseResult<SubscriptionKind>;
  installPlan: FirehoseResult<InstallPlanKind[]>;
  packageManifest: FirehoseResult<PackageManifestKind[]>;
}
