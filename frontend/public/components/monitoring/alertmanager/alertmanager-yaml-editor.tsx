import type { FC } from 'react';
import { useState, memo } from 'react';
import * as _ from 'lodash-es';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { NavBar } from '@console/internal/components/utils/horizontal-nav';
import { Alert, Content, ContentVariants, PageSection } from '@patternfly/react-core';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { breadcrumbsForGlobalConfig } from '../../cluster-settings/global-config';

import { K8sResourceKind } from '../../../module/k8s';
import { AsyncComponent } from '../../utils/async';
import { Firehose } from '../../utils/firehose';
import { StatusBox } from '../../utils/status-box';
import { patchAlertmanagerConfig, getAlertmanagerYAML } from './alertmanager-utils';

const EditAlertmanagerYAML = (props) => (
  <AsyncComponent
    {...props}
    loader={() => import('../../edit-yaml').then((c) => c.EditYAML)}
    create={false}
    genericYAML
  />
);

const AlertmanagerYAMLEditor: FC<AlertmanagerYAMLEditorProps> = ({ obj: secret }) => {
  const [errorMsg, setErrorMsg] = useState<string>();
  const [successMsg, setSuccessMsg] = useState<string>();
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
      <PageSection hasBodyWrapper={false} className="pf-v6-u-pb-0">
        <Content component={ContentVariants.p}>
          {t(
            'public~Update this YAML to configure Routes, Receivers, Groupings and other Alertmanager settings.',
          )}
        </Content>
      </PageSection>
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

const AlertmanagerYAMLEditorWrapper: FC<AlertmanagerYAMLEditorWrapperProps> = memo(
  ({ obj, ...props }) => {
    const { t } = useTranslation();
    return (
      <>
        <DocumentTitle>{t('public~Alerting')}</DocumentTitle>
        <StatusBox {...obj}>
          <AlertmanagerYAMLEditor {...props} obj={obj.data} />
        </StatusBox>
      </>
    );
  },
);

export const AlertmanagerYAML: FC<{}> = () => {
  const { t } = useTranslation();

  const configPath = 'alertmanagerconfig';
  const YAMLPath = 'alertmanageryaml';

  const breadcrumbs = breadcrumbsForGlobalConfig('Alertmanager', configPath);

  return (
    <>
      <PageHeading breadcrumbs={breadcrumbs} title={t('public~Alertmanager')} />
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
