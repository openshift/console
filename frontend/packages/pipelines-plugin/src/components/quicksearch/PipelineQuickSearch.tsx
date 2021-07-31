import * as React from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import CatalogServiceProvider, {
  CatalogService,
} from '@console/dev-console/src/components/catalog/service/CatalogServiceProvider';
import { QuickSearchController, QuickSearchProviders } from '@console/shared';
import { TaskSearchCallback } from '../pipelines/pipeline-builder/types';

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: TaskSearchCallback;
}

const Contents: React.FC<{
  catalogService: CatalogService;
} & QuickSearchProps> = ({
  catalogService,
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
}) => {
  const { t } = useTranslation();
  const savedCallback = React.useRef(null);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const catalogServiceItems = catalogService.items.map((service) => {
    service.cta.callback = () => {
      savedCallback.current(service.data);
    };
    return service;
  });

  const quickSearchProviders: QuickSearchProviders = [
    {
      catalogType: 'pipelinesTaskCatalog',
      items: catalogServiceItems,
      loaded: catalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) => `/search/ns/${ns}?keyword=${searchTerm}`,
      // t('pipelines-plugin~View all tekton tasks ({{itemCount, number}})')
      catalogLinkLabel: 'pipelines-plugin~View all tekton tasks ({{itemCount, number}})',
      extensions: catalogService.catalogExtensions,
    },
  ];
  return (
    <QuickSearchController
      quickSearchProviders={quickSearchProviders}
      allItemsLoaded={catalogService.loaded}
      searchPlaceholder={`${t('pipelines-plugin~Add task')}...`}
      namespace={namespace}
      viewContainer={viewContainer}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      disableKeyboardOpen
      limitItemCount={0}
      icon={<PlusCircleIcon width="1.5em" height="1.5em" />}
    />
  );
};

const PipelineQuickSearch: React.FC<QuickSearchProps> = ({
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
}) => {
  return (
    <CatalogServiceProvider namespace={namespace} catalogId="pipelines-task-catalog">
      {(catalogService: CatalogService) => (
        <Contents
          {...{
            namespace,
            viewContainer,
            isOpen,
            setIsOpen,
            catalogService,
            callback,
          }}
        />
      )}
    </CatalogServiceProvider>
  );
};

export default React.memo(PipelineQuickSearch);
