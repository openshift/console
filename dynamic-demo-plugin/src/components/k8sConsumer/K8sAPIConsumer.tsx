import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertGroup,
  Button,
  Card,
  CardBody,
  CodeBlock,
  CodeBlockCode,
  Page,
  PageSection,
  Title,
} from '@patternfly/react-core';
import {
  getGroupVersionKindForResource,
  k8sCreate,
  k8sDelete,
  k8sGet,
  k8sListItems,
  k8sPatch,
  K8sResourceCommon,
  k8sUpdate,
  useK8sModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { mockDeploymetData } from './k8s-data';

const K8sAPIConsumer: React.FC = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  const [k8sModel] = useK8sModel(getGroupVersionKindForResource(mockDeploymetData));
  const [errData, setErrData] = React.useState<string>();
  const [k8sCreateData, setK8sCreateData] = React.useState<K8sResourceCommon>();
  const [k8sGetData, setK8sGetData] = React.useState<K8sResourceCommon>();
  const [k8sUpdateData, setK8sUpdateData] = React.useState<K8sResourceCommon>();
  const [k8sPatchData, setK8sPatchData] = React.useState<K8sResourceCommon>();
  const [k8sListData, setK8sListData] = React.useState<K8sResourceCommon[]>();
  const [k8sDeleteData, setK8sDeleteData] = React.useState<K8sResourceCommon>();

  const k8sCreateClick = () => {
    k8sCreate({ model: k8sModel, data: mockDeploymetData })
      .then((response) => {
        setErrData('');
        setK8sCreateData(response);
      })
      .catch((e) => {
        setErrData(e.message);
        console.error(e);
      });
  };

  const k8sGetClick = () => {
    k8sGet({ model: k8sModel, name: 'sampleapp', ns: 'default' })
      .then((response) => {
        setErrData('');
        setK8sGetData(response);
      })
      .catch((e) => {
        setErrData(e.message);
        console.error(e);
      });
  };

  const k8sPatchClick = () => {
    const patchData = [
      {
        op: 'replace',
        path: '/metadata/labels',
        value: {
          app: 'httpd',
          appPatch: 'patch',
        },
      },
    ];

    k8sPatch({ model: k8sModel, resource: mockDeploymetData, data: patchData })
      .then((response) => {
        setErrData('');
        setK8sPatchData(response);
      })
      .catch((e) => {
        setErrData(e.message);
        console.error(e);
      });
  };

  const k8sUpdateClick = () => {
    const updatedData = {
      ...mockDeploymetData,
      metadata: {
        ...mockDeploymetData.metadata,
        labels: {
          app: 'httpd',
          appUpdate: 'updated',
        },
      },
    };
    k8sUpdate({ model: k8sModel, data: updatedData })
      .then((response) => {
        setErrData('');
        setK8sUpdateData(response);
      })
      .catch((e) => {
        setErrData(e.message);
        console.error(e);
      });
  };

  const k8sListClick = () => {
    k8sListItems({ model: k8sModel, queryParams: { ns: 'default' } })
      .then((response) => {
        setErrData('');
        setK8sListData(response);
      })
      .catch((e) => {
        setErrData(e.message);
        console.error(e);
      });
  };

  const k8sDeleteClick = () => {
    k8sDelete({ model: k8sModel, resource: mockDeploymetData })
      .then((response) => {
        setErrData('');
        setK8sDeleteData(response);
      })
      .catch((e) => {
        setErrData(e.message);
        console.error(e);
      });
  };

  return (
    <Page
      additionalGroupedContent={
        <PageSection variant="light">
          <Title headingLevel="h1" data-test="test-k8sapi-title">{t('K8s API from Dynamic Plugin SDK')}</Title>
        </PageSection>
      }
    >
      <PageSection>
        {errData && (
          <AlertGroup>
            <Alert data-test="test-k8api-error" title={errData} variant="warning" isInline />
          </AlertGroup>
        )}
        <Card>
          <CardBody>
            <Button isBlock onClick={k8sCreateClick}>
              {t('k8sCreate')}
            </Button>
            <ConsoleK8sAPIConsumer data-test="test-k8s-create" data={k8sCreateData} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Button isBlock onClick={k8sGetClick}>
              {t('k8sGet')}
            </Button>
            <ConsoleK8sAPIConsumer data-test="test-k8s-get" data={k8sGetData} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Button isBlock onClick={k8sPatchClick}>
              {t('k8sPatch')}
            </Button>
            <ConsoleK8sAPIConsumer data-test="test-k8s-patch" data={k8sPatchData} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Button isBlock onClick={k8sUpdateClick}>
              {t('k8sUpdate')}
            </Button>
            <ConsoleK8sAPIConsumer data-test="test-k8s-update" data={k8sUpdateData} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Button isBlock onClick={k8sListClick}>
              {t('k8sList')}
            </Button>
            <ConsoleK8sAPIConsumer data-test="test-k8s-list" data={k8sListData} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Button isBlock onClick={k8sDeleteClick}>
              {t('k8sDelete')}
            </Button>
            <ConsoleK8sAPIConsumer data-test="test-k8s-delete" data={k8sDeleteData} />
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

const ConsoleK8sAPIConsumer: React.FC<{ data: any }> = ({ data }) => {
  return (
    <CodeBlock>
      <CodeBlockCode>
        {JSON.stringify(data, null, 2)}
      </CodeBlockCode>
    </CodeBlock>
  );
};

export default K8sAPIConsumer;
