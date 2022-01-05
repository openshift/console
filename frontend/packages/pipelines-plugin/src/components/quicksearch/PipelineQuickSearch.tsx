import * as React from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import {
  QuickSearchController,
  QuickSearchProviders,
  CatalogService,
  CatalogServiceProvider,
} from '@console/shared';
import { TektonTaskProviders } from '../pipelines/const';
import { useCleanupOnFailure, useLoadingTaskCleanup } from '../pipelines/pipeline-builder/hooks';
import {
  PipelineBuilderTaskGroup,
  TaskSearchCallback,
  UpdateTasksCallback,
} from '../pipelines/pipeline-builder/types';
import {
  createTask,
  findInstalledTask,
  getSelectedVersionUrl,
  isTaskSearchable,
  updateTask,
} from './pipeline-quicksearch-utils';
import PipelineQuickSearchDetails from './PipelineQuickSearchDetails';

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: TaskSearchCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
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
  onUpdateTasks,
  taskGroup,
}) => {
  const { t } = useTranslation();
  const savedCallback = React.useRef(null);
  savedCallback.current = callback;
  const [failedTasks, setFailedTasks] = React.useState<string[]>([]);

  useLoadingTaskCleanup(onUpdateTasks, taskGroup);
  useCleanupOnFailure(failedTasks, onUpdateTasks, taskGroup);

  const catalogServiceItems = catalogService.items.reduce((acc, item) => {
    const installedTask = findInstalledTask(catalogService.items, item);

    if (item.provider === TektonTaskProviders.community) {
      item.attributes.installed = '';
      if (installedTask) {
        const installedVersion = item.attributes?.versions?.find(
          (v) => v.version === installedTask.attributes?.versions[0]?.version,
        );
        if (installedVersion) {
          item.attributes.installed = installedVersion.id.toString();
        }
      }
    }

    item.cta.callback = ({ selectedVersion }) => {
      return new Promise((resolve) => {
        if (item.provider === TektonTaskProviders.community) {
          const selectedVersionUrl = getSelectedVersionUrl(item, selectedVersion);
          if (installedTask) {
            if (selectedVersion === item.attributes.installed) {
              resolve(savedCallback.current(installedTask.data));
            } else {
              resolve(savedCallback.current({ metadata: { name: item.data.name } }));
              updateTask(selectedVersionUrl, installedTask, namespace, item.data.name).catch(() =>
                setFailedTasks([...failedTasks, item.data.name]),
              );
            }
          } else {
            resolve(savedCallback.current({ metadata: { name: item.data.name } }));
            createTask(selectedVersionUrl, namespace).catch(() =>
              setFailedTasks([...failedTasks, item.data.name]),
            );
          }
        } else {
          resolve(savedCallback.current(item.data));
        }
      });
    };

    if (isTaskSearchable(catalogService.items, item)) {
      acc.push(item);
    }
    return acc;
  }, []);

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
      icon={<PlusCircleIcon width="1.5em" height="1.5em" />}
      detailsRenderer={(props) => <PipelineQuickSearchDetails {...props} />}
    />
  );
};

const PipelineQuickSearch: React.FC<QuickSearchProps> = ({
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
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
            onUpdateTasks,
            taskGroup,
          }}
        />
      )}
    </CatalogServiceProvider>
  );
};

export default React.memo(PipelineQuickSearch);
