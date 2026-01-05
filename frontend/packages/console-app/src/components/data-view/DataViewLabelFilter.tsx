import { useState } from 'react';
import { ToolbarFilter } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom-v5-compat';
import AutocompleteInput from '@console/internal/components/autocomplete';

type DataViewLabelFilterProps<TData> = {
  data: TData[];
  title: string;
  filterId: string;
  onChange?: (key: string, selectedValues: string) => void;
  showToolbarItem?: boolean;
};

export const DataViewLabelFilter = <TData,>({
  data,
  title,
  filterId,
  onChange,
  showToolbarItem,
}: DataViewLabelFilterProps<TData>) => {
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const [labelInputText, setLabelInputText] = useState('');
  const labelSelection = searchParams.get(filterId)?.split(',') ?? [];

  const applyLabelFilters = (values: string[]) => {
    setLabelInputText('');
    onChange?.(filterId, values.join(','));
  };

  return (
    <ToolbarFilter
      categoryName={title}
      labels={labelSelection}
      showToolbarItem={showToolbarItem}
      deleteLabel={(_category, label: string) => {
        setLabelInputText('');
        applyLabelFilters(_.difference(labelSelection, [label]));
      }}
      deleteLabelGroup={() => {
        setLabelInputText('');
        applyLabelFilters([]);
      }}
    >
      <div className="pf-v6-c-input-group co-filter-group">
        <AutocompleteInput
          color="purple"
          onSuggestionSelect={(selected) => {
            applyLabelFilters(_.uniq([...labelSelection, selected]));
          }}
          showSuggestions
          textValue={labelInputText}
          setTextValue={setLabelInputText}
          placeholder={t('public~Filter by label')}
          data={data}
        />
      </div>
    </ToolbarFilter>
  );
};
