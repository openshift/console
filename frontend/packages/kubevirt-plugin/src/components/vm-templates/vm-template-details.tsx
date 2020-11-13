import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionLink, Stack, StackItem } from '@patternfly/react-core';
import {
  ScrollToTopOnMount,
  SectionHeading,
  useAccessReview,
  asAccessReview,
  history,
} from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';

import {
  VMTemplateResourceSummary,
  VMTemplateDetailsList,
  VMTemplateSchedulingList,
} from './vm-template-resource';
import { HashAnchor } from '../hash-anchor/hash-anchor';
import { TemplateSourceStatus } from '../../statuses/template/types';
import { getTemplateName, isCommonTemplate } from '../../selectors/vm-template/basic';
import { getVMWizardCreateLink } from '../../utils/url';
import { VMWizardMode, VMWizardName } from '../../constants';

export const VMTemplateDetails: React.FC<VMTemplateDetailsProps> = ({
  obj: template,
  customData,
}) => {
  const { t } = useTranslation();
  const canUpdate =
    useAccessReview(asAccessReview(TemplateModel, template, 'patch')) &&
    !isCommonTemplate(template);

  return (
    <>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <Stack hasGutter>
          {isCommonTemplate(template) && (
            <StackItem>
              <Alert
                variant="info"
                isInline
                title={t('kubevirt-plugin~Red Hat provided templates can not be edited')}
                actionLinks={
                  <>
                    <AlertActionLink
                      onClick={() =>
                        history.push(
                          getVMWizardCreateLink({
                            wizardName: VMWizardName.WIZARD,
                            mode: VMWizardMode.TEMPLATE,
                            template,
                          }),
                        )
                      }
                    >
                      {t('kubevirt-plugin~Create a new custom template')}
                    </AlertActionLink>
                  </>
                }
              >
                <Stack>
                  <StackItem>
                    {t(
                      'kubevirt-plugin~{{ name }} can not be edited because it is provided by the Red Hat OpenShift Virtualization Operator.',
                      { name: getTemplateName(template) },
                    )}
                  </StackItem>
                  <StackItem>
                    {t(
                      'kubevirt-plugin~We suggest you create a custom Template from this Red Hat template.',
                    )}
                  </StackItem>
                </Stack>
              </Alert>
            </StackItem>
          )}
          <StackItem>
            <HashAnchor hash="details" />
            <SectionHeading text={t('kubevirt-plugin~VM Template Details')} />
            <div className="row">
              <div className="col-sm-6">
                <VMTemplateResourceSummary template={template} canUpdateTemplate={canUpdate} />
              </div>
              <div className="col-sm-6">
                <VMTemplateDetailsList
                  template={template}
                  canUpdateTemplate={canUpdate}
                  {...customData}
                />
              </div>
            </div>
          </StackItem>
        </Stack>
      </div>
      <div className="co-m-pane__body">
        <HashAnchor hash="scheduling" />
        <SectionHeading text={t('kubevirt-plugin~Scheduling and resources requirements')} />
        <div className="row">
          <VMTemplateSchedulingList template={template} canUpdateTemplate={canUpdate} />
        </div>
      </div>
    </>
  );
};

type VMTemplateDetailsProps = {
  obj: TemplateKind;
  customData: {
    sourceStatus: TemplateSourceStatus;
    sourceLoaded: boolean;
    sourceLoadError: any;
  };
};
