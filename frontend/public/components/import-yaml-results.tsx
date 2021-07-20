import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Bullseye, Button, Spinner } from '@patternfly/react-core';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import {
  TableComposable,
  TableGridBreakpoint,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';

import { ResourceLink } from './utils';
import { referenceFor } from '../module/k8s';

/**
 * Without this prop our current TS types fail to match and require a `translate` prop to be added. PF suggests we
 * update our types, but that causes other issues. This will have to do as a workaround for now.
 *
 * This is the best that I can find relates to this value:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/3423b4fc3e3da09f8acc386bc2fee6fb8f5e0880/types/react/index.d.ts#L1763
 */
const reactPropFix = {
  translate: 'no',
};

export const ImportYAMLPageStatus: React.FC<ImportYAMLStatusProps> = ({ errors, inFlight }) => {
  const { t } = useTranslation();
  let StatusBlock: React.ReactNode;

  if (inFlight) {
    StatusBlock = (
      <>
        <Spinner size="lg" />
        <h2>{t('public~Creating resources...')}</h2>
      </>
    );
  } else if (!inFlight && !errors) {
    StatusBlock = (
      <>
        <GreenCheckCircleIcon size="lg" />
        <h2>{t('public~Resources successfully created')}</h2>
      </>
    );
  } else {
    StatusBlock = (
      <>
        <YellowExclamationTriangleIcon size="lg" />
        <h2>{t('public~One or more resources failed to be created')}</h2>
      </>
    );
  }
  return <div className="co-import-yaml-status pf-u-text-align-center">{StatusBlock}</div>;
};

export const ImportYAMLResourceStatus: React.FC<ImportYAMLResourceStatusProps> = ({
  creating,
  error,
  message,
}) => {
  let StatusIcon: React.ReactNode;
  if (creating) {
    StatusIcon = <Spinner size="sm" className="co-icon-space-r" />;
  } else if (error) {
    StatusIcon = <RedExclamationCircleIcon className="co-icon-space-r" size="sm" />;
  } else {
    StatusIcon = <GreenCheckCircleIcon className="co-icon-space-r" size="sm" />;
  }
  return (
    <span>
      {StatusIcon}
      {message}
    </span>
  );
};

export const ImportYAMLResults: React.FC<ImportYAMLResultsProps> = ({
  createResources,
  displayResults,
  importResources,
  retryFailed,
}) => {
  const { t } = useTranslation();
  const [importStatus, setImportStatus] = React.useState<ImportYAMLResourceStatusProps[]>(
    importResources.map(() => ({
      creating: true,
      message: t('public~Creating'),
    })),
  );
  const [inFlight, setInFlight] = React.useState(true);
  const [errors, setErrors] = React.useState(false);
  React.useEffect(() => {
    const requests = createResources(importResources);
    Promise.allSettled(requests).then(() => {
      setInFlight(false);
    });
    requests.forEach((resourceRequest, index) => {
      resourceRequest
        .then(() =>
          setImportStatus((prevResources) => {
            const nextResources = [...prevResources];
            nextResources[index] = {
              creating: false,
              message: t('public~Created'),
            };
            return nextResources;
          }),
        )
        .catch((error) => {
          setErrors(true);
          setImportStatus((prevResources) => {
            const nextResources = [...prevResources];
            nextResources[index] = {
              creating: false,
              error: true,
              message: t('public~Error: {{error}}', { error: error.message }),
            };
            return nextResources;
          });
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRetry = () => {
    const failedResourceObjects = importStatus.reduce((acc, status, index) => {
      if (!status.error) {
        return acc;
      }
      return [...acc, importResources[index]];
    }, []);
    retryFailed(failedResourceObjects);
  };

  return (
    <div className="co-import-yaml-results-page">
      <Helmet>
        <title>{t('public~Import YAML Results')}</title>
      </Helmet>
      <Bullseye>
        <div className="co-import-yaml-results-page__main">
          <ImportYAMLPageStatus inFlight={inFlight} errors={errors} />
          <TableComposable
            gridBreakPoint={TableGridBreakpoint.none}
            variant="compact"
            aria-label={t('public~Import YAML results')}
            {...reactPropFix}
          >
            <Thead {...reactPropFix}>
              <Tr {...reactPropFix}>
                <Th {...reactPropFix}>{t('public~Name')}</Th>
                <Th {...reactPropFix}>{t('public~Namespace')}</Th>
                <Th {...reactPropFix}>{t('public~Creation status')}</Th>
              </Tr>
            </Thead>
            <Tbody {...reactPropFix}>
              {importResources.map((resource, index) => (
                <Tr key={`${resource.metadata.name}-${resource.metadata.kind}`} {...reactPropFix}>
                  <Td {...reactPropFix}>
                    <ResourceLink
                      kind={referenceFor(resource) || resource.metadata.kind}
                      name={resource.metadata.name}
                      namespace={resource.metadata?.namespace}
                      linkTo={!inFlight && !importStatus[index].error}
                    />
                  </Td>
                  <Td {...reactPropFix}>
                    {resource.metadata?.namespace ? (
                      <ResourceLink kind="Namespace" name={resource.metadata.namespace} />
                    ) : (
                      '-'
                    )}
                  </Td>
                  <Td {...reactPropFix}>
                    <ImportYAMLResourceStatus
                      creating={importStatus[index].creating}
                      error={importStatus[index].error}
                      message={importStatus[index].message}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableComposable>
          {!inFlight && (
            <>
              {errors && (
                <div className="co-import-yaml-results-page__footer">
                  <Button variant="primary" type="button" onClick={onRetry}>
                    {t('public~Retry failed resources')}
                  </Button>
                </div>
              )}
              <div className="co-import-yaml-results-page__footer">
                <Button
                  data-test="import-more-yaml"
                  variant="link"
                  type="button"
                  onClick={() => displayResults(false)}
                >
                  {t('public~Import more YAML')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Bullseye>
    </div>
  );
};

type ImportYAMLStatusProps = {
  errors?: boolean;
  inFlight: boolean;
};
type ImportYAMLResourceStatusProps = {
  creating: boolean;
  error?: boolean;
  message: string;
};
type ImportYAMLResultsProps = {
  createResources: (objs: any, isDryRun?: boolean) => any;
  displayResults: (value: boolean) => void;
  importResources: any;
  retryFailed: (retryObjects: any) => void;
};
