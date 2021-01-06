import * as React from 'react';
import { TFunction } from 'i18next';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import {
  ActionGroup,
  Button,
  EmptyState,
  Title,
  EmptyStateBody,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { ButtonBar, StatusBox, history, ExternalLink } from '@console/internal/components/utils';
import { getNamespace, getUID } from '@console/shared';
import { isTemplateSourceError } from '../../../statuses/template/types';
import { getTemplateSourceStatus } from '../../../statuses/template/template-source-status';
import { filterTemplates } from '../../vm-templates/utils';
import { getTemplateName } from '../../../selectors/vm-template/basic';
import NamespacedPage, {
  NamespacedPageVariants,
} from '../../../../../dev-console/src/components/NamespacedPage';
import { createVM } from '../../../k8s/requests/vm/create/simple-create';
import { CreateVMForm } from '../forms/create-vm-form';
import { getTemplateOSIcon } from '../../vm-templates/os-icons';
import { formReducer, initFormState } from '../forms/create-vm-form-reducer';
import { useStorageClassConfigMap } from '../../../hooks/storage-class-config-map';
import { BOOT_SOURCE_AVAILABLE, SUPPORT_URL } from '../../../constants/vm-templates';
import { useVmTemplatesResources } from '../hooks/use-vm-templates-resources';
import { getDescription } from '../../../selectors/selectors';

const DevConsoleCreateVmFormEmptyState: React.FC<{ templateParam: string; t: TFunction }> = ({
  templateParam,
  t,
}) => (
  <EmptyState>
    <Title headingLevel="h4" size="lg">
      {t('kubevirt-plugin~Error Loading Template')}
    </Title>
    <EmptyStateBody>
      {t('kubevirt-plugin~Virtual machine template {{ templateParam }} not found.', {
        templateParam,
      })}
    </EmptyStateBody>
    <Button variant="primary" onClick={() => history.push('/catalog?catalogType=VmTemplate')}>
      {t('kubevirt-plugin~Back to templates catalog')}
    </Button>
  </EmptyState>
);

export const DevConsoleCreateVmForm: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const templateParam = urlParams.get('template');
  const templateNs = urlParams.get('templateNs') || 'openshift';
  const namespace = urlParams.get('namespace') || 'default';

  const {
    pods,
    dataVolumes,
    pvcs,
    userTemplates,
    baseTemplates,
    resourcesLoaded,
    resourcesLoadError,
  } = useVmTemplatesResources(namespace);

  const selectedTemplate = filterTemplates(userTemplates, baseTemplates)
    .filter((tmp) => {
      const tempSourceStatus = getTemplateSourceStatus({
        pods,
        pvcs,
        dataVolumes,
        template: tmp.variants[0],
      });

      if (isTemplateSourceError(tempSourceStatus) || !tempSourceStatus?.isReady) {
        return false;
      }
      return true;
    })
    .find(
      (tmp) =>
        templateParam === tmp?.metadata?.name &&
        tmp?.variants?.[0].metadata.namespace === templateNs,
    );

  const [state, dispatch] = React.useReducer(formReducer, initFormState(namespace));
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [createError, setCreateError] = React.useState<string>();
  const [scConfigMap, scLoaded, scError] = useStorageClassConfigMap();
  const template = selectedTemplate?.variants?.[0];
  const templateDescription = getDescription(template);
  const sourceStatus = getTemplateSourceStatus({
    pvcs,
    pods,
    dataVolumes,
    template,
  });
  const sourceProvider = !isTemplateSourceError(sourceStatus) && sourceStatus?.provider;

  return (
    <NamespacedPage hideApplications disabled variant={NamespacedPageVariants.light}>
      <div className="co-m-pane__body">
        <h1 className="co-m-pane__heading">
          {t('kubevirt-plugin~Review and create virtual machine')}
        </h1>
        <Helmet>
          <title>{t('kubevirt-plugin~Virtual Machines')}</title>
        </Helmet>
        <StatusBox
          data={template}
          loaded={resourcesLoaded}
          loadError={resourcesLoadError}
          label={t('kubevirt-plugin~Virtual Machine Template')}
          EmptyMsg={() => <DevConsoleCreateVmFormEmptyState templateParam={templateParam} t={t} />}
        >
          <div className="row">
            {template && (
              <>
                <div className="col-md-7 col-md-push-5 co-catalog-item-info">
                  <div className="co-catalog-item-info">
                    <div className="co-catalog-item-details">
                      <span className="co-catalog-item-icon">
                        <img
                          alt=""
                          className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
                          src={getTemplateOSIcon(template)}
                        />
                      </span>
                      <div>
                        <h2 className="co-section-heading co-catalog-item-details__name">
                          {getTemplateName(template)}
                        </h2>
                        <ul className="list-inline">
                          <li className="co-break-work">
                            <ExternalLink
                              href={SUPPORT_URL}
                              text={t('kubevirt-plugin~Learn more about operating system support')}
                            />
                          </li>
                        </ul>
                      </div>
                    </div>
                    <p className="co-catalog-item-details__description">
                      <Stack hasGutter>
                        {templateDescription && <StackItem>{templateDescription}</StackItem>}
                        {sourceProvider && sourceProvider !== BOOT_SOURCE_AVAILABLE && (
                          <StackItem>
                            {t(
                              "kubevirt-plugin~This template's boot source is defined by {{providerParam}}",
                              {
                                providerParam: sourceProvider,
                              },
                            )}
                          </StackItem>
                        )}
                      </Stack>
                    </p>
                    <>
                      <hr />
                      <Trans t={t} ns="kubevirt-plugin">
                        <p>The following resources will be created:</p>
                      </Trans>
                      <ul>
                        <li key="virtual-machine">{t('kubevirt-plugin~Virtual machine')}</li>
                      </ul>
                    </>
                  </div>
                </div>
                <div className="col-md-5 col-md-pull-7">
                  <Stack hasGutter>
                    <StackItem>
                      <CreateVMForm
                        dispatch={dispatch}
                        state={state}
                        template={selectedTemplate}
                        sourceStatus={sourceStatus}
                        cdRomText={t(
                          'kubevirt-plugin~A new disk has been added to support the CD-ROM boot source.',
                        )}
                        showCreateInfo={false}
                        showProjectDropdown={false}
                      />
                    </StackItem>
                    <StackItem>
                      <ButtonBar
                        inProgress={isSubmitting}
                        errorMessage={
                          createError ||
                          (!isTemplateSourceError(sourceStatus) && sourceStatus?.isCDRom
                            ? scError
                            : undefined)
                        }
                      >
                        <ActionGroup className="pf-c-form">
                          <Button
                            type="submit"
                            variant="primary"
                            isDisabled={
                              !state.isValid ||
                              isSubmitting ||
                              (!isTemplateSourceError(sourceStatus) && sourceStatus?.isCDRom
                                ? !scLoaded || !!scError
                                : false)
                            }
                            onClick={async () => {
                              setCreateError(null);
                              try {
                                setSubmitting(true);
                                const vm = await createVM(
                                  state.template,
                                  sourceStatus,
                                  undefined,
                                  state,
                                  scConfigMap,
                                );
                                history.push(
                                  `/topology/ns/${getNamespace(vm)}?selectId=${getUID(vm)}`,
                                );
                              } catch (err) {
                                setSubmitting(false);
                                setCreateError(err.message);
                              } finally {
                                setSubmitting(false);
                              }
                            }}
                          >
                            {t('kubevirt-plugin~Create Virtual Machine')}
                          </Button>
                          <Button type="button" variant="secondary" onClick={history.goBack}>
                            {t('kubevirt-plugin~Cancel')}
                          </Button>
                        </ActionGroup>
                      </ButtonBar>
                    </StackItem>
                  </Stack>
                </div>
              </>
            )}
          </div>
        </StatusBox>
      </div>
    </NamespacedPage>
  );
};
