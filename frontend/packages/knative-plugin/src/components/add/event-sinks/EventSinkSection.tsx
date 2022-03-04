import * as React from 'react';
import { TextVariants, Text } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { descriptorsToUISchema } from '@console/operator-lifecycle-manager/src/components/operand/utils';
import { DynamicFormField, useFormikValidationFix } from '@console/shared';
import { formDescriptorData } from '../../../utils/create-eventsources-utils';
import { EventSources } from '../import-types';
import SourceSection from './SourceSection';

interface EventSinkSectionProps {
  namespace: string;
  fullWidth?: boolean;
  kameletSink?: K8sResourceKind;
}

const EventSinkSection: React.FC<EventSinkSectionProps> = ({
  namespace,
  fullWidth = false,
  kameletSink,
}) => {
  const { values } = useFormikContext<FormikValues>();
  const projectResource = { kind: ProjectModel.kind, prop: ProjectModel.id, isList: true };
  const [data, loaded] = useK8sWatchResource<K8sResourceKind[]>(projectResource);
  useFormikValidationFix(values);
  const formSchema: JSONSchema7 = React.useMemo(
    () => ({
      type: 'object',
      required: kameletSink?.spec?.definition?.required,
      properties: kameletSink?.spec?.definition?.properties,
    }),
    [kameletSink],
  );

  if (!values.formData.type) {
    return null;
  }
  const defaultFormSection = (
    <>
      <SourceSection namespace={namespace} fullWidth={fullWidth} />
      <AppSection
        project={values.formData.project}
        noProjectsAvailable={loaded && _.isEmpty(data)}
        extraMargin
        subPath="formData"
        fullWidth={fullWidth}
      />
    </>
  );
  let EventSink: React.ReactElement = null;
  if (values.formData.type === EventSources.KameletBinding) {
    EventSink = kameletSink && (
      <>
        <Text component={TextVariants.h2}>{kameletSink.spec?.definition?.title}</Text>
        <DynamicFormField
          name="formData.data.KameletBinding.sink.properties"
          schema={formSchema}
          uiSchema={descriptorsToUISchema(formDescriptorData(formSchema.properties), formSchema)}
          showAlert={false}
        />
      </>
    );
  }
  return (
    <>
      {EventSink}
      {defaultFormSection}
    </>
  );
};

export default EventSinkSection;
