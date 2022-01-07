import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { NamespaceModel, TemplateModel } from '@console/internal/models';
import { TEMPLATE_SUPPORT_LEVEL } from '../../../constants';
import { VIRTUALMACHINES_TEMPLATES_BASE_URL } from '../../../constants/url-params';
import { useCustomizeSourceModal } from '../../../hooks/use-customize-source-modal';
import { useSupportModal } from '../../../hooks/use-support-modal';
import { getAnnotation } from '../../../selectors/selectors';
import { getTemplateName, getTemplateProvider } from '../../../selectors/vm-template/basic';
import { getTemplateSourceStatus } from '../../../statuses/template/template-source-status';
import { TemplateItem } from '../../../types/template';
import { DASH, dimensifyRow } from '../../../utils';
import { menuActionsCreator } from '../menu-actions';
import { getTemplateOSIcon } from '../os-icons';
import { TemplateSource } from '../vm-template-source';
import RowActions from './RowActions';
import { VMTemplateRowProps } from './types';
import { tableColumnClasses } from './utils';
import './vm-template-table.scss';

const VMTemplateRow: React.FC<RowFunctionArgs<TemplateItem, VMTemplateRowProps>> = ({
  obj,
  customData: {
    dataVolumes,
    pvcs,
    pods,
    namespace,
    loaded,
    togglePin,
    isPinned,
    sourceLoadError,
    dataSources,
  },
}) => {
  const { t } = useTranslation();
  const [template] = obj.variants;
  const dimensify = dimensifyRow(tableColumnClasses(!namespace));
  const sourceStatus = getTemplateSourceStatus({
    template,
    pvcs,
    dataVolumes,
    pods,
    dataSources: dataSources?.data,
  });
  const provider = getTemplateProvider(t, template);
  const pinned = isPinned(obj);
  const withSupportModal = useSupportModal();
  const withCustomizeModal = useCustomizeSourceModal();
  return (
    <>
      <TableData className={dimensify()}>
        <Button
          className={pinned ? 'kv-pin-remove-btn' : 'kv-pin-btn'}
          variant="plain"
          aria-label="pin-templte-action"
          onClick={() => togglePin(obj)}
        >
          <StarIcon />
        </Button>
      </TableData>
      <TableData className={dimensify()}>
        <img src={getTemplateOSIcon(template)} alt="" className="kubevirt-vm-template-logo" />
        <Link
          to={`/k8s/ns/${template.metadata.namespace}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}/${template.metadata.name}`}
          data-test-id={template.metadata.name}
          className="co-resource-item__resource-name"
        >
          {getTemplateName(template)}
        </Link>
      </TableData>
      <TableData data-test="template-provider" className={dimensify()}>
        {provider}
      </TableData>
      <TableData data-test="template-support" className={dimensify()}>
        {getAnnotation(template, TEMPLATE_SUPPORT_LEVEL) || DASH}
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={template.metadata.namespace} />
      </TableData>
      <TableData
        className={dimensify()}
        data-test="template-source"
        data-test-template-name={template.metadata.name}
      >
        <TemplateSource
          loadError={sourceLoadError}
          loaded={loaded}
          template={template}
          sourceStatus={sourceStatus}
          detailed
        />
      </TableData>
      <TableData className={dimensify()}>
        <RowActions template={template} sourceStatus={sourceStatus} namespace={namespace} />
      </TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={menuActionsCreator(TemplateModel, obj, null, {
            togglePin,
            pinned,
            namespace,
            withSupportModal,
            sourceStatus,
            sourceLoaded: true,
            sourceLoadError,
            withCustomizeModal,
          })}
          key={`kebab-for-${template.metadata.uid}`}
          id={`kebab-for-${template.metadata.uid}`}
        />
      </TableData>
    </>
  );
};

export default VMTemplateRow;
