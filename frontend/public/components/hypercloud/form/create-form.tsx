import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useForm, FormProvider } from 'react-hook-form';
import { DevTool } from '@hookform/devtools';
import { ActionGroup, Button } from '@patternfly/react-core';
import { k8sCreate, referenceFor, K8sResourceKind, modelFor } from '../../../module/k8s';
import { pluralToKind } from './';
import { ButtonBar, history, resourceObjPath } from '../../utils';
import { Section } from '../utils/section';

export const WithCommonForm = (SubForm, params, defaultValues, modal?: boolean) => {
  const FormComponent: React.FC<CommonFormProps_> = props => {
    const methods = useForm({ defaultValues: defaultValues });

    const kind = pluralToKind(params.plural);
    const title = `${props.titleVerb} ${params?.type === 'form' ? '' : params.type || 'Sample'} ${kind || ''}`;

    const [inProgress] = React.useState(false); // onSubmit이나 나중에 Error관련 메서드에서 inProgress를 false로 변경해줘야함.

    const onClick = methods.handleSubmit(data => {
      let inDo = _.defaultsDeep(props.fixed, data);
      inDo = props.onSubmitCallback(inDo);
      k8sCreate(modelFor(kind), inDo);
      history.push(resourceObjPath(inDo, referenceFor(modelFor(kind))));
    });
    return (
      <FormProvider {...methods}>
        <div className="co-m-pane__body">
          <Helmet>
            <title>{title}</title>
          </Helmet>
          <form className="co-m-pane__body-group co-m-pane__form">
            <h1 className="co-m-pane__heading">{title}</h1>
            <p className="co-m-pane__explanation">{props.explanation}</p>
            <fieldset>
              <div className="form-group">
                <Section label="Name" id="name" isRequired={true}>
                  <input className="pf-c-form-control" id="name" name="metadata.name" ref={methods.register} />
                </Section>
              </div>
            </fieldset>
            <SubForm isCreate={props.isCreate} />
            <ButtonBar inProgress={inProgress}>
              <ActionGroup className="pf-c-form">
                <Button type="button" variant="primary" id="save-changes" onClick={onClick}>
                  {props.saveButtonText || 'Create'}
                </Button>
                <Button type="button" variant="secondary" id="cancel" onClick={history.goBack}>
                  Cancel
                </Button>
              </ActionGroup>
            </ButtonBar>
          </form>
          <DevTool control={methods.control} />
        </div>
      </FormProvider>
    );
  };
  return FormComponent;
};

type CommonFormProps_ = {
  obj?: K8sResourceKind;
  fixed: object;
  isCreate: boolean;
  titleVerb: string;
  onSubmitCallback: Function;
  saveButtonText?: string;
  explanation?: string;
};
