import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { TemplateModel } from '@console/internal/models';
import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateForm } from './TemplateForm';

export const CreateFromTemplate: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const title = 'kubevirt-plugin~Instantiate Template';
  const urlParams = new URLSearchParams(props.location.search);
  const templateNS = urlParams.get('template-ns');
  const templateName = urlParams.get('template-name');
  const [template, templateLoaded, templateError] = useK8sWatchResource<TemplateKind>({
    kind: TemplateModel.kind,
    namespace: templateNS,
    name: templateName,
  });

  return (
    <>
      <Helmet>
        <title>{t(title)}</title>
      </Helmet>
      {templateLoaded && (
        <div className="co-m-pane__body">
          <h1 className="co-m-pane__heading">{t(title)}</h1>
          <TemplateForm
            {...props}
            preselectedNamespace={props.match.params.ns}
            obj={{
              data: template,
              loaded: templateLoaded,
              loadError: templateError,
            }}
          />
        </div>
      )}
    </>
  );
};
