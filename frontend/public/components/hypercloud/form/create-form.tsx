import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useForm, Controller } from "react-hook-form"
import { DevTool } from "@hookform/devtools";
import { ActionGroup, Button } from '@patternfly/react-core';
// import { k8sCreate, k8sUpdate, referenceFor, K8sResourceKind } from '../../../module/k8s';
import { k8sCreate, referenceFor, K8sResourceKind, modelFor } from '../../../module/k8s';
import { pluralToKind } from './'
// import { NamespaceModel } from '../../../models';
// import {
//   ButtonBar,
//   history,
//   resourceObjPath,
// } from '../../utils';
import {
  ButtonBar,
  history,
  resourceObjPath
} from '../../utils';

export const WithCommonForm = (SubForm, params?: any, modal?: boolean) => {
  const FormComponent: React.FC<CommonFormProps_> = props => {
    const { register, control, watch, handleSubmit } = useForm();
    const kind = pluralToKind(params.plural);
    const title = `${props.titleVerb} ${params.type === 'form' ? '' : params.type} ${kind}`;

    const [inProgress] = React.useState(false); // onSubmit이나 나중에 Error관련 메서드에서 inProgress를 false로 변경해줘야함.

    const onSubmit = handleSubmit((data) => {
      let inDo = _.defaultsDeep(props.fixed, data);
      inDo = props.onSubmitCallback(inDo);
      console.log(watch());
      // if (false) {
      k8sCreate(modelFor(kind), inDo)
      history.push(resourceObjPath(inDo, referenceFor(modelFor(kind))));
      // }
    });


    return (
      <div className="co-m-pane__body" onSubmit={onSubmit}>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form
          className="co-m-pane__body-group co-create-secret-form co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">{props.explanation}</p>
          <fieldset>
            <div className="form-group">
              <label className="control-label co-required" htmlFor="name">Name</label>
              <input className="pf-c-form-control" id="name" name='metadata.name' ref={register} />
            </div>
          </fieldset>
          <SubForm isCreate={props.isCreate} register={register} control={control} Controller={Controller} />
          <ButtonBar inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button
                type="submit"
                variant="primary"
                id="save-changes"
              >
                {props.saveButtonText || 'Create'}
              </Button>
              <Button type="button" variant="secondary" id="cancel" onClick={props.onCancel}>
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
        <DevTool control={control} />
      </div>
    )
  }
  return FormComponent;
}

type CommonFormProps_ = {
  obj?: K8sResourceKind;
  fixed: object;
  isCreate: boolean;
  titleVerb: string;
  onSubmitCallback: Function;
  saveButtonText?: string;
  explanation?: string;
  onCancel?: () => void;
  onSave?: (name: string) => void;
};

// type DefaultInputForm_ = {
//   apiVersiont: string;
//   kind: string;
//   type?: string;
//   metadata: {
//     name: '',
//     [propName: string]: any;
//   }
//   [propName: string]: any;
// }