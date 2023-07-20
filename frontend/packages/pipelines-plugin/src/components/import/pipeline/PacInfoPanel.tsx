import * as React from 'react';
import { ClipboardCopy, ClipboardCopyVariant } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import {
  ReadableResourcesNames,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import './PacSection.scss';

const InfoPanel: React.FC = () => {
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();
  const {
    values: { name, resources },
  } = useFormikContext<FormikValues>();
  const translatedResourceName = ReadableResourcesNames[resources as Resources]
    ? t(ReadableResourcesNames[resources as Resources])
    : '';

  return (
    <FormSection>
      <div className="odc-pipeline-section-pac__info-panel">
        <div className="odc-pipeline-section-pac__info-text">
          <Trans t={t} ns="pipelines-plugin" values={{ translatedResourceName, name }}>
            Once your Pipeline Repository is configured, in order to update your{' '}
            {{ translatedResourceName }} <code className="co-code">{{ name }}</code> automatically,
            update the following in your <code className="co-code">.tekton</code> PipelineRun:
          </Trans>
        </div>
        <ul>
          <li>
            <strong> {translatedResourceName}: </strong>
            <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>{name}</ClipboardCopy>
          </li>
          <li className="odc-pipeline-section-pac__clipboard">
            <strong>
              {t('pipelines-plugin~Internal image registry:')}
              {'  '}
            </strong>
            <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
              image-registry.openshift-image-registry.svc:5000/{namespace}/{name}
            </ClipboardCopy>
          </li>
        </ul>
      </div>
    </FormSection>
  );
};

export default InfoPanel;
