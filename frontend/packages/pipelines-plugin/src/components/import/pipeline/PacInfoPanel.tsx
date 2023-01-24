import * as React from 'react';
import { ClipboardCopy, ClipboardCopyVariant, Text } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import {
  ReadableResourcesNames,
  Resources,
} from '@console/dev-console/src/components/import/import-types';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useActiveNamespace } from '@console/shared/src';
import './PacSection.scss';

const InfoPanel: React.FC = () => {
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();
  const { values } = useFormikContext<FormikValues>();
  const translatedResourceName = ReadableResourcesNames[values.resources as Resources]
    ? t(ReadableResourcesNames[values.resources as Resources])
    : '';

  return (
    <FormSection>
      <Text className="odc-pipeline-section-pac__info-panel">
        <Trans t={t} ns="pipelines-plugin">
          <div className="odc-pipeline-section-pac__info-text">
            Once your Pipeline Repository is configured, in order to update your{' '}
            {translatedResourceName} <code className="co-code">{values.name}</code> automatically,
            update the following in your <code className="co-code">.tekton</code> PipelineRun:
          </div>
        </Trans>
        <ul>
          <Trans t={t} ns="pipelines-plugin">
            <li>
              <strong> {translatedResourceName}: </strong>
              <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
                {values.name}
              </ClipboardCopy>
            </li>
          </Trans>
          <li className="odc-pipeline-section-pac__clipboard">
            <strong>
              {t('pipelines-plugin~Internal image registry:')}
              {'  '}
            </strong>
            <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
              image-registry.openshift-image-registry.svc:5000/{namespace}/{values.name}
            </ClipboardCopy>
          </li>
        </ul>
      </Text>
    </FormSection>
  );
};

export default InfoPanel;
