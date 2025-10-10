# Data View Components

This directory contains two main data view components:

## GeneralDataView

A generic data view component that works with any data type, not just Kubernetes resources.

### Features

- Generic type support for any data type
- Configurable filtering (name and label filters)
- Column management
- Pagination
- Sorting
- Loading and empty states

### Usage

```tsx
import {
  GeneralDataView,
  GeneralFilters,
  GetGeneralDataViewRows,
} from '@console/app/src/components/data-view';

// Define your data type
interface MyData {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

// Define your filters
interface MyFilters extends GeneralFilters {
  category?: string;
}

// Create a function to convert your data to DataView rows
const getDataViewRows: GetGeneralDataViewRows<MyData, any> = (data, columns) => {
  return data.map((item) => [
    {
      title: item.name,
      id: 'name',
    },
    {
      title: item.description,
      id: 'description',
    },
    {
      title: item.tags.join(', '),
      id: 'tags',
    },
  ]);
};

// Use the component
<GeneralDataView
  label="My Items"
  data={myData}
  loaded={true}
  columns={myColumns}
  initialFilters={{ name: '', label: '' }}
  getDataViewRows={getDataViewRows}
  getNameFromItem={(item) => item.name}
  getLabelsAsString={(item) => item.tags.join(', ')}
/>;
```

### Props

- `data`: Array of data items
- `loaded`: Boolean indicating if data is loaded
- `columns`: Table column definitions
- `initialFilters`: Initial filter values
- `getDataViewRows`: Function to convert data to DataView rows
- `getNameFromItem`: Function to extract name from data item (for name filtering)
- `getLabelsAsString`: Function to extract labels as string from data item (for label filtering)
- `matchesAdditionalFilters`: Optional function for custom filtering logic

## ResourceDataView

A specialized data view component for Kubernetes resources. This is now a wrapper around GeneralDataView that provides K8s-specific functionality.

### Features

- All GeneralDataView features
- Built-in support for K8s resource metadata
- Automatic name and label filtering for K8s resources
- Backward compatible with existing code

### Usage

```tsx
import {
  ResourceDataView,
  ResourceFilters,
  GetDataViewRows,
} from '@console/app/src/components/data-view';

// Use with K8s resources
<ResourceDataView
  label="Pods"
  data={pods}
  loaded={loaded}
  columns={podColumns}
  initialFilters={{ name: '', label: '' }}
  getDataViewRows={getPodDataViewRows}
/>;
```

## Migration Guide

If you're using ResourceDataView, no changes are needed - it's fully backward compatible.

To use GeneralDataView for non-K8s data:

1. Import `GeneralDataView` instead of `ResourceDataView`
2. Provide `getNameFromItem` and `getLabelsAsString` functions
3. Use `GeneralFilters` instead of `ResourceFilters`
4. Use `GetGeneralDataViewRows` instead of `GetDataViewRows`

## Types

- `GeneralFilters`: Base filter type with name and label
- `GeneralDataViewColumn<TData>`: Column definition for any data type
- `GetGeneralDataViewRows<TData, TCustomRowData>`: Function type for converting data to rows
- `GeneralRowProps<TData, TCustomRowData>`: Row data structure

## Hooks

- `useGeneralDataViewFilters`: Generic filtering logic
- `useGeneralDataViewData`: Generic data processing and pagination
- `useResourceDataViewFilters`: K8s-specific filtering (used by ResourceDataView)
- `useResourceDataViewData`: K8s-specific data processing (used by ResourceDataView)
