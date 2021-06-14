import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateSupport } from '../../../constants/vm-templates/support';

type CustomizeSourceFormState = {
  name: string;
  namespace: string;
  cloudInit: string;
  size: { unit: string; value: string };
  selectedTemplate: TemplateKind;
  injectCloudInit: boolean;
  provider: string;
  support: string;
};

export enum FORM_ACTION_TYPE {
  SET_NAME = 'name',
  SET_NAMESPACE = 'namespace',
  SET_CLOUD_INIT = 'cloudInit',
  INJECT_CLOUD_INIT = 'injectCloudInit',
  SET_SIZE = 'size',
  SET_SELECTED_TEMPLATE = 'selectedTemplate',
  SET_PROVIDER = 'provider',
  SET_SUPPORT = 'support',
}

type CustomizeSourceFormAction =
  | {
      type: FORM_ACTION_TYPE.SET_NAME;
      payload: CustomizeSourceFormState['name'];
    }
  | {
      type: FORM_ACTION_TYPE.SET_NAMESPACE;
      payload: CustomizeSourceFormState['namespace'];
    }
  | {
      type: FORM_ACTION_TYPE.SET_CLOUD_INIT;
      payload: CustomizeSourceFormState['cloudInit'];
    }
  | {
      type: FORM_ACTION_TYPE.INJECT_CLOUD_INIT;
      payload: CustomizeSourceFormState['injectCloudInit'];
    }
  | {
      type: FORM_ACTION_TYPE.SET_SIZE;
      payload: CustomizeSourceFormState['size'];
    }
  | {
      type: FORM_ACTION_TYPE.SET_SELECTED_TEMPLATE;
      payload: CustomizeSourceFormState['selectedTemplate'];
    }
  | {
      type: FORM_ACTION_TYPE.SET_PROVIDER;
      payload: CustomizeSourceFormState['provider'];
    }
  | {
      type: FORM_ACTION_TYPE.SET_SUPPORT;
      payload: CustomizeSourceFormState['support'];
    };

export const initFormState = (namespace: string): CustomizeSourceFormState => ({
  name: undefined,
  namespace,
  cloudInit: undefined,
  size: { unit: 'Gi', value: '20' },
  selectedTemplate: undefined,
  injectCloudInit: undefined,
  provider: undefined,
  support: TemplateSupport.NO_SUPPORT.getValue(),
});

export const formReducer = (
  state: CustomizeSourceFormState,
  action: CustomizeSourceFormAction,
): CustomizeSourceFormState => ({
  ...state,
  [action.type]: action.payload,
});
