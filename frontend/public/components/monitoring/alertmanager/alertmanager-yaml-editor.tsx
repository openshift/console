import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { NavBar } from '@console/internal/components/utils';
import { Alert, Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { breadcrumbsForGlobalConfig } from '../../cluster-settings/global-config';

import PrimaryHeading from '@console/shared/src/components/heading/PrimaryHeading';
import { K8sResourceKind } from '../../../module/k8s';
import { AsyncComponent, Firehose, StatusBox } from '../../utils';
import { patchAlertmanagerConfig, getAlertmanagerYAML } from './alertmanager-utils';

const EditAlertmanagerYAML = (props) => (
  <AsyncComponent
    {...props}
    loader={() => import('../../edit-yaml').then((c) => c.EditYAML)}
    create={false}
    genericYAML
  />
);

const AlertmanagerYAMLEditor: React.FC<AlertmanagerYAMLEditorProps> = ({ obj: secret }) => {
  const [errorMsg, setErrorMsg] = React.useState<string>();
  const [successMsg, setSuccessMsg] = React.useState<string>();
  const { t } = useTranslation();

  const save = (yaml: string) => {
    if (_.isEmpty(yaml)) {
      setErrorMsg('Alertmanager configuration cannot be empty.');
      setSuccessMsg('');
      return;
    }
    try {
      safeLoad(yaml);
    } catch (e) {
      setErrorMsg(`Error parsing Alertmanager YAML: ${e}`);
      setSuccessMsg('');
      return;
    }
    patchAlertmanagerConfig(secret, yaml).then(
      (newSecret) => {
        setSuccessMsg(
          `${newSecret.metadata.name} has been updated to version ${newSecret.metadata.resourceVersion}`,
        );
        setErrorMsg('');
      },
      (err) => {
        setErrorMsg(err.message);
        setSuccessMsg('');
      },
    );
  };

  const { yaml: alertmanagerYAML, errorMessage: loadErrorMsg } = getAlertmanagerYAML(secret);

  if (loadErrorMsg) {
    return (
      <Alert
        isInline
        className="co-alert co-alert--scrollable"
        variant="danger"
        title="An error occurred"
      >
        <div className="co-pre-line">{loadErrorMsg}</div>
      </Alert>
    );
  }

  return (
    <>
      <div className="co-m-nav-title">
        <p className="help-block">
          {t(
            'public~Update this YAML to configure Routes, Receivers, Groupings and other Alertmanager settings.',
          )}
        </p>
      </div>
      <EditAlertmanagerYAML onSave={save} obj={alertmanagerYAML}>
        {errorMsg && (
          <Alert
            isInline
            className="co-alert co-alert--scrollable"
            variant="danger"
            title="An error occurred"
          >
            <div className="co-pre-line">{errorMsg}</div>
          </Alert>
        )}
        {successMsg && (
          <Alert
            isInline
            className="co-alert"
            variant="success"
            title={successMsg}
            data-test="alert-success"
          />
        )}
      </EditAlertmanagerYAML>
    </>
  );
};

const AlertmanagerYAMLEditorWrapper: React.FC<AlertmanagerYAMLEditorWrapperProps> = React.memo(
  ({ obj, ...props }) => {
    const { t } = useTranslation();
    return (
      <>
        <Helmet>
          <title>{t('public~Alerting')}</title>
        </Helmet>
        <StatusBox {...obj}>
          <AlertmanagerYAMLEditor {...props} obj={obj.data} />
        </StatusBox>
      </>
    );
  },
);

const AlertmanagerYAML: React.FC<{}> = () => {
  const { t } = useTranslation();

  const configPath = 'alertmanagerconfig';
  const YAMLPath = 'alertmanageryaml';

  const breadcrumbs = breadcrumbsForGlobalConfig('Alertmanager', configPath);

  return (
    <>
      <div className="pf-v6-c-page__main-breadcrumb">
        <Breadcrumb className="monitoring-breadcrumbs">
          <BreadcrumbItem>
            <Link className="pf-v6-c-breadcrumb__link" to={breadcrumbs[0].path}>
              {breadcrumbs[0].name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{breadcrumbs[1].name}</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
        <PrimaryHeading>
          <div className="co-m-pane__name co-resource-item">
            <span className="co-resource-item__resource-name" data-test-id="resource-title">
              {t('public~Alertmanager')}
            </span>
          </div>
        </PrimaryHeading>
      </div>
      <NavBar
        pages={[
          {
            name: t('public~Details'),
            href: configPath,
          },
          {
            name: t('public~YAML'),
            href: YAMLPath,
          },
        ]}
      />
      <Firehose
        resources={[
          {
            kind: 'Secret',
            name: 'alertmanager-main',
            namespace: 'openshift-monitoring',
            isList: false,
            prop: 'obj',
          },
        ]}
      >
        <AlertmanagerYAMLEditorWrapper />
      </Firehose>
    </>
  );
};

type AlertmanagerYAMLEditorWrapperProps = {
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
};

type AlertmanagerYAMLEditorProps = {
  obj?: K8sResourceKind;
  onCancel?: () => void;
};

export default AlertmanagerYAML;
