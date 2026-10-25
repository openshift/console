import { useTranslation } from 'react-i18next';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useQueryParams } from '@console/shared/src/hooks/useQueryParams';
import { AsyncComponent } from './utils/async';

export const ImportYamlPage = () => {
  const { t } = useTranslation('public');
  const queryParams = useQueryParams();
  const title = t('Import YAML');

  const isCodeImportRedirect = queryParams.get('ols') === 'true';

  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <AsyncComponent
        initialResource={undefined}
        blame="ImportYamlPage"
        loader={() => import('./droppable-edit-yaml').then((c) => c.DroppableEditYAML)}
        allowMultiple
        create
        download={false}
        header={title}
        isCodeImportRedirect={isCodeImportRedirect}
      />
    </>
  );
};
