import * as React from 'react';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import * as classNames from 'classnames';
import {
  ActionGroup,
  Button,
  Divider,
  FormGroup,
  TextInput,
  HelperText,
  HelperTextItem,
  Tooltip,
  TextArea,
  InputGroup,
  InputGroupItem,
} from '@patternfly/react-core';
import { CompressIcon, ExpandIcon } from '@patternfly/react-icons/dist/js/icons';
/* eslint-disable import/named */
import { useTranslation } from 'react-i18next';

import { ANNOTATIONS, withActivePerspective } from '@console/shared';

import { Perspective, isPerspective } from '@console/dynamic-plugin-sdk';
import { withExtensions } from '@console/plugin-sdk';
import catalogImg from '../imgs/logos/catalog-icon.svg';
import {
  getImageForIconClass,
  getTemplateIcon,
  normalizeIconClass,
} from './catalog/catalog-item-icon';
import {
  ButtonBar,
  ExternalLink,
  Firehose,
  LoadError,
  LoadingBox,
  NsDropdown,
  PageHeading,
} from './utils';
import { SecretModel, TemplateInstanceModel } from '../models';
import {
  K8sResourceKind,
  TemplateKind,
  TemplateInstanceKind,
  TemplateParameter,
} from '../module/k8s';
import { k8sCreateResource, k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { RootState } from '../redux';

const TemplateResourceDetails: React.FC<TemplateResourceDetailsProps> = ({ template }) => {
  const resources = _.uniq(_.compact(_.map(template.objects, 'kind'))).sort();
  if (_.isEmpty(resources)) {
    return null;
  }

  return (
    <>
      <Divider className="co-divider" />
      <p>The following resources will be created:</p>
      <ul>
        {resources.map((kind: string) => (
          <li key={kind}>{kind}</li>
        ))}
      </ul>
    </>
  );
};
TemplateResourceDetails.displayName = 'TemplateResourceDetails';

const TemplateInfo: React.FC<TemplateInfoProps> = ({ template }) => {
  const { t } = useTranslation();
  const annotations = template.metadata.annotations || {};
  const { description } = annotations;
  const displayName = annotations[ANNOTATIONS.displayName] || template.metadata.name;
  const iconClass = getTemplateIcon(template);
  const imgURL = iconClass ? getImageForIconClass(iconClass) : catalogImg;
  const tags = (annotations.tags || '').split(/\s*,\s*/);
  const documentationURL = annotations[ANNOTATIONS.documentationURL];
  const supportURL = annotations[ANNOTATIONS.supportURL];

  return (
    <div className="co-catalog-item-info">
      <div className="co-catalog-item-details">
        <div className="co-catalog-item-icon">
          <span className="co-catalog-item-icon__bg">
            {imgURL ? (
              <img
                className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
                src={imgURL}
                alt={displayName}
                aria-hidden
              />
            ) : (
              <span
                className={classNames(
                  'co-catalog-item-icon__icon co-catalog-item-icon__icon--large',
                  normalizeIconClass(iconClass),
                )}
                aria-hidden
              />
            )}
          </span>
        </div>
        <div>
          <h2 className="co-section-heading co-catalog-item-details__name">{displayName}</h2>
          {!_.isEmpty(tags) && (
            <p className="co-catalog-item-details__tags">
              {_.map(tags, (tag, i) => (
                <span className="co-catalog-item-details__tag" key={i}>
                  {tag}
                </span>
              ))}
            </p>
          )}
          {(documentationURL || supportURL) && (
            <ul className="list-inline">
              {documentationURL && (
                <li className="co-break-word">
                  <ExternalLink href={documentationURL} text={t('public~View documentation')} />
                </li>
              )}
              {supportURL && (
                <li className="co-break-word">
                  <ExternalLink href={supportURL} text={t('public~Get support')} />
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      {description && <p className="co-catalog-item-details__description">{description}</p>}
      <TemplateResourceDetails template={template} />
    </div>
  );
};
TemplateInfo.displayName = 'TemplateInfo';

const stateToProps = (state: RootState) => ({
  models: state.k8s.getIn(['RESOURCES', 'models']),
});

const TemplateFormField: React.FC<TemplateFormFieldProps> = ({
  name,
  value,
  displayName,
  description,
  onChange,
  placeholder,
  required,
  helpID,
}) => {
  const [isTextArea, setIsTextArea] = React.useState(false);
  const { t } = useTranslation('public');

  const commonFormProps = {
    'aria-describedby': helpID,
    placeholder,
    isRequired: required,
    onChange,
    value,
    id: name,
    name,
  };

  const toggleTooltipText = isTextArea
    ? t('Compress to a single line of content. This may strip any new lines you have entered.')
    : t(
        'Expand to enter multiple lines of content. This is required if you need to include newline characters.',
      );

  const InputToggle = (
    <Tooltip aria="none" aria-live="polite" content={toggleTooltipText}>
      <Button
        aria-label={toggleTooltipText}
        onClick={() => setIsTextArea(!isTextArea)}
        variant="control"
      >
        {isTextArea ? <CompressIcon /> : <ExpandIcon />}
      </Button>
    </Tooltip>
  );

  return (
    <FormGroup label={displayName || name} isRequired={required} fieldId={name}>
      <InputGroup>
        <InputGroupItem isFill>
          {isTextArea ? (
            <TextArea resizeOrientation="vertical" {...commonFormProps} />
          ) : (
            <TextInput type="text" {...commonFormProps} />
          )}
        </InputGroupItem>
        <InputGroupItem>{InputToggle}</InputGroupItem>
      </InputGroup>
      {description && (
        <HelperText>
          <HelperTextItem id={helpID}>{description}</HelperTextItem>
        </HelperText>
      )}
    </FormGroup>
  );
};

const TemplateForm_: React.FC<TemplateFormProps> = (props) => {
  const { preselectedNamespace: ns = '', activePerspective, perspectiveExtensions, obj } = props;

  const [namespace, setNamespace] = React.useState(ns);
  const [parameters, setParameters] = React.useState([]);
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState('');
  const isInitialLoad = React.useRef(true);

  const { t } = useTranslation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isInitialLoad.current && obj.loaded) {
      const object = (obj.data.parameters || []).reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {});
      setParameters(object);
      isInitialLoad.current = false;
    }
  }, [obj]);

  const onParameterChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    setParameters((prevParams) => ({ ...prevParams, [name]: value }));
  };

  const createTemplateSecret = () => {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: `${obj.data.metadata.name}-parameters-`,
        namespace,
      },
      // Remove empty values.
      stringData: parameters,
    };
    return k8sCreateResource({
      model: SecretModel,
      data: secret,
    });
  };

  const createTemplateInstance = (secret: K8sResourceKind) => {
    const instance: TemplateInstanceKind = {
      apiVersion: 'template.openshift.io/v1',
      kind: 'TemplateInstance',
      metadata: {
        generateName: `${obj.data.metadata.name}-`,
        namespace,
      },
      spec: {
        template: obj.data as TemplateKind,
        secret: {
          name: secret.metadata.name,
        },
      },
    };
    return k8sCreateResource({
      model: TemplateInstanceModel,
      data: instance,
    });
  };

  const updatesecretOwnerRef = (secret: K8sResourceKind, templateInstance: K8sResourceKind) => {
    const updatedSecret = {
      ...secret,
      metadata: {
        ...secret.metadata,
        ownerReferences: [
          {
            apiVersion: templateInstance.apiVersion,
            kind: templateInstance.kind,
            name: templateInstance.metadata.name,
            uid: templateInstance.metadata.uid,
          },
        ],
      },
    };
    return k8sUpdateResource({
      model: SecretModel,
      data: updatedSecret,
      name: secret.metadata.name,
      ns: secret.metadata.namespace,
    });
  };

  const save = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    if (!namespace) {
      setError('Please complete all fields.');
      return;
    }

    setError('');
    setInProgress(true);

    createTemplateSecret()
      .then((secret: K8sResourceKind) => {
        return createTemplateInstance(secret).then(async (templateInstance: K8sResourceKind) => {
          await updatesecretOwnerRef(secret, templateInstance);
          setInProgress(false);
          const activeExtension = perspectiveExtensions.find(
            (p) => p.properties.id === activePerspective,
          );
          const url = (await activeExtension.properties.importRedirectURL())(namespace);
          navigate(url);
        });
      })
      .catch((err) => {
        setInProgress(false);
        setError(err.message);
      });
  };

  if (obj.loadError) {
    return <LoadError label={t('public~Template')}>{obj.loadError.message}</LoadError>;
  }

  if (!obj.loaded) {
    return <LoadingBox />;
  }

  const template: TemplateKind = obj.data;
  const params = template.parameters || [];

  return (
    <div className="row">
      <div className="col-md-7 col-md-push-5 co-catalog-item-info">
        <TemplateInfo template={template} />
      </div>
      <div className="col-md-5 col-md-pull-7">
        <form className="pf-v6-c-form co-instantiate-template-form" onSubmit={save}>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="namespace">
              {t('public~Namespace')}
            </label>
            <NsDropdown selectedKey={namespace} onChange={(v) => setNamespace(v)} id="namespace" />
          </div>
          {params.map(
            ({
              name,
              displayName,
              description,
              required: requiredParam,
              generate,
            }: TemplateParameter) => {
              const value = parameters[name] || '';
              const helpID = description ? `${name}-help` : '';
              const placeholder = generate ? t('public~(generated if empty)') : '';
              // Only set required for parameters not generated.
              const requiredInput = requiredParam && !generate;
              return (
                <TemplateFormField
                  key={name}
                  name={name}
                  value={value}
                  displayName={displayName}
                  description={description}
                  required={requiredInput}
                  onChange={onParameterChanged}
                  placeholder={placeholder}
                  helpID={helpID}
                />
              );
            },
          )}
          <ButtonBar className="co-instantiate-template-form__button-bar" errorMessage={error}>
            <ActionGroup className="pf-v6-c-form">
              <Button type="submit" variant="primary" isLoading={inProgress}>
                {t('public~Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    </div>
  );
};

const TemplateForm = connect(stateToProps)(
  withExtensions<ExtensionsProps>({ perspectiveExtensions: isPerspective })(
    withActivePerspective<TemplateFormProps>(TemplateForm_),
  ),
);

export const InstantiateTemplatePage: React.FC<{}> = (props) => {
  const title = 'Instantiate Template';
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const templateName = searchParams.get('template');
  const templateNamespace = searchParams.get('template-ns');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const resources = [
    {
      kind: 'Template',
      name: templateName,
      namespace: templateNamespace,
      isList: false,
      prop: 'obj',
    },
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} />
      <div className="co-m-pane__body co-m-pane__body--no-top-margin">
        <Firehose resources={resources}>
          <TemplateForm preselectedNamespace={preselectedNamespace} {...(props as any)} />
        </Firehose>
      </div>
    </>
  );
};

type TemplateResourceDetailsProps = {
  template: TemplateKind;
};

type TemplateInfoProps = {
  template: TemplateKind;
};

type ExtensionsProps = {
  perspectiveExtensions: Perspective[];
};

type TemplateFormProps = ExtensionsProps & {
  obj: any;
  preselectedNamespace: string;
  models: any;
  activePerspective: string;
};

type TemplateFormFieldProps = {
  name: string;
  value: string;
  displayName: string;
  description: string;
  required: boolean;
  onChange: React.ReactEventHandler;
  placeholder: string;
  helpID: string;
};
