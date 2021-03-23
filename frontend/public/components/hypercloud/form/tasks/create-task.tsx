import * as _ from 'lodash-es';
import * as React from 'react';
import { match as RMatch } from 'react-router';
import { useFormContext, Controller } from 'react-hook-form';
import { WithCommonForm } from '../create-form';
import { Section } from '../../utils/section';
import { SelectorInput } from '../../../utils';

// const allow = 'allow';
// const deny = 'deny';

// const defaultDeny = {
//   apiVersion: 'networking.k8s.io/v1',
//   kind: 'NetworkPolicy',
//   spec: {
//     podSelector: null,
//   },
// };

const defaultValues = {
  metadata: {
    name: 'example-name',
  },
};

const taskFormFactory = params => {
  return WithCommonForm(CreateTaskComponent, params, defaultValues);
};

const CreateTaskComponent: React.FC<TaskFormProps> = props => {
  const { control } = useFormContext();
  return (
    <>
      <Section label="Labels" id="label" description="이것은 Label입니다.">
        <Controller name="metadata.labels" id="label" labelClassName="co-text-sample" as={SelectorInput} control={control} tags={[]} />
      </Section>
      <Section label="Input Resource" id="inputResource" description="이 태스크와 연결된 인풋 리소스가 없습니다.">
        모달
      </Section>
    </>
  );
};

export const CreateTask: React.FC<CreateTaskProps> = props => {
  const formComponent = taskFormFactory(props.match.params);
  const TaskFormComponent = formComponent;
  return <TaskFormComponent fixed={{}} explanation={''} titleVerb="Create" onSubmitCallback={onSubmitCallback} isCreate={true} />;
};

export const onSubmitCallback = data => {
  let labels = SelectorInput.objectify(data.metadata.labels);
  delete data.metadata.labels;
  data = _.defaultsDeep(data, { metadata: { labels: labels } });
  return data;
};

type CreateTaskProps = {
  match: RMatch<{
    type?: string;
  }>;
  fixed: object;
  explanation: string;
  titleVerb: string;
  saveButtonText?: string;
  isCreate: boolean;
};

type TaskFormProps = {
  onChange: Function;
  stringData: {
    [key: string]: string;
  };
  isCreate: boolean;
};
