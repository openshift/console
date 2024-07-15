# OpenShift Console API

1.  [useActivePerspective](#useactiveperspective)
2.  [GreenCheckCircleIcon](#greencheckcircleicon)
3.  [RedExclamationCircleIcon](#redexclamationcircleicon)
4.  [YellowExclamationTriangleIcon](#yellowexclamationtriangleicon)
5.  [BlueInfoCircleIcon](#blueinfocircleicon)
6.  [ErrorStatus](#errorstatus)
7.  [InfoStatus](#infostatus)
8.  [ProgressStatus](#progressstatus)
9.  [SuccessStatus](#successstatus)
10.  [checkAccess](#checkaccess)
11.  [useAccessReview](#useaccessreview)
12.  [useResolvedExtensions](#useresolvedextensions)
13.  [HorizontalNav](#horizontalnav)
14.  [VirtualizedTable](#virtualizedtable)
15.  [TableData](#tabledata)
16.  [useActiveColumns](#useactivecolumns)
17.  [ListPageHeader](#listpageheader)
18.  [ListPageCreate](#listpagecreate)
19.  [ListPageCreateLink](#listpagecreatelink)
20.  [ListPageCreateButton](#listpagecreatebutton)
21.  [ListPageCreateDropdown](#listpagecreatedropdown)
22.  [ListPageFilter](#listpagefilter)
23.  [useListPageFilter](#uselistpagefilter)
24.  [ResourceLink](#resourcelink)
25.  [ResourceIcon](#resourceicon)
26.  [useK8sModel](#usek8smodel)
27.  [useK8sModels](#usek8smodels)
28.  [useK8sWatchResource](#usek8swatchresource)
29.  [useK8sWatchResources](#usek8swatchresources)
30.  [consoleFetch](#consolefetch)
31.  [consoleFetchJSON](#consolefetchjson)
32.  [consoleFetchText](#consolefetchtext)
33.  [getConsoleRequestHeaders](#getconsolerequestheaders)
34.  [k8sGetResource](#k8sgetresource)
35.  [k8sCreateResource](#k8screateresource)
36.  [k8sUpdateResource](#k8supdateresource)
37.  [k8sPatchResource](#k8spatchresource)
38.  [k8sDeleteResource](#k8sdeleteresource)
39.  [k8sListResource](#k8slistresource)
40.  [k8sListResourceItems](#k8slistresourceitems)
41.  [getAPIVersionForModel](#getapiversionformodel)
42.  [getGroupVersionKindForResource](#getgroupversionkindforresource)
43.  [getGroupVersionKindForModel](#getgroupversionkindformodel)
44.  [StatusPopupSection](#statuspopupsection)
45.  [StatusPopupItem](#statuspopupitem)
46.  [Overview](#overview)
47.  [OverviewGrid](#overviewgrid)
48.  [InventoryItem](#inventoryitem)
49.  [InventoryItemTitle](#inventoryitemtitle)
50.  [InventoryItemBody](#inventoryitembody)
51.  [InventoryItemStatus](#inventoryitemstatus)
52.  [InventoryItemLoading](#inventoryitemloading)
53.  [useFlag](#useflag)
54.  [CodeEditor](#codeeditor)
55.  [ResourceYAMLEditor](#resourceyamleditor)
56.  [ResourceEventStream](#resourceeventstream)
57.  [usePrometheusPoll](#useprometheuspoll)
58.  [Timestamp](#timestamp)
59.  [useModal](#usemodal)
60.  [ActionServiceProvider](#actionserviceprovider)
61.  [NamespaceBar](#namespacebar)
62.  [ErrorBoundaryFallbackPage](#errorboundaryfallbackpage)
63.  [QueryBrowser](#querybrowser)
64.  [useAnnotationsModal](#useannotationsmodal)
65.  [useDeleteModal](#usedeletemodal)
66.  [useLabelsModal](#uselabelsmodal)
67.  [useActiveNamespace](#useactivenamespace)
68.  [useUserSettings](#useusersettings)
69.  [useQuickStartContext](#usequickstartcontext)
70. [DEPRECATED] [PerspectiveContext](#perspectivecontext)
71. [DEPRECATED] [useAccessReviewAllowed](#useaccessreviewallowed)
72. [DEPRECATED] [useSafetyFirst](#usesafetyfirst)
73. [DEPRECATED] [YAMLEditor](#yamleditor)

---

## `useActivePerspective`

### Summary 

Hook that provides the currently active perspective and a callback for setting the active perspective



### Example


```tsx
const Component: React.FC = (props) => {
   const [activePerspective, setActivePerspective] = useActivePerspective();
   return <select
     value={activePerspective}
     onChange={(e) => setActivePerspective(e.target.value)}
   >
     {
       // ...perspective options
     }
   </select>
}
```







### Returns

A tuple containing the current active perspective and setter callback.


---

## `GreenCheckCircleIcon`

### Summary 

Component for displaying a green check mark circle icon.



### Example


```tsx
<GreenCheckCircleIcon title="Healthy" />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `className` | (optional) additional class name for the component |
| `title` | (optional) icon title |
| `size` | (optional) icon size: ('sm', 'md', 'lg', 'xl') |



---

## `RedExclamationCircleIcon`

### Summary 

Component for displaying a red exclamation mark circle icon.



### Example


```tsx
<RedExclamationCircleIcon title="Failed" />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `className` | (optional) additional class name for the component |
| `title` | (optional) icon title |
| `size` | (optional) icon size: ('sm', 'md', 'lg', 'xl') |



---

## `YellowExclamationTriangleIcon`

### Summary 

Component for displaying a yellow triangle exclamation icon.



### Example


```tsx
<YellowExclamationTriangleIcon title="Warning" />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `className` | (optional) additional class name for the component |
| `title` | (optional) icon title |
| `size` | (optional) icon size: ('sm', 'md', 'lg', 'xl') |



---

## `BlueInfoCircleIcon`

### Summary 

Component for displaying a blue info circle icon.



### Example


```tsx
<BlueInfoCircleIcon title="Info" />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `className` | (optional) additional class name for the component |
| `title` | (optional) icon title |
| `size` | (optional) icon size: ('sm', 'md', 'lg', 'xl') |



---

## `ErrorStatus`

### Summary 

Component for displaying an error status popover.



### Example


```tsx
<ErrorStatus title={errorMsg} />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `title` | (optional) status text |
| `iconOnly` | (optional) if true, only displays icon |
| `noTooltip` | (optional) if true, tooltip is not displayed |
| `className` | (optional) additional class name for the component |
| `popoverTitle` | (optional) title for popover |



---

## `InfoStatus`

### Summary 

Component for displaying an information status popover.



### Example


```tsx
<InfoStatus title={infoMsg} />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `title` | (optional) status text |
| `iconOnly` | (optional) if true, only displays icon |
| `noTooltip` | (optional) if true, tooltip is not displayed |
| `className` | (optional) additional class name for the component |
| `popoverTitle` | (optional) title for popover |



---

## `ProgressStatus`

### Summary 

Component for displaying a progressing status popover.



### Example


```tsx
<ProgressStatus title={progressMsg} />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `title` | (optional) status text |
| `iconOnly` | (optional) if true, only displays icon |
| `noTooltip` | (optional) if true, tooltip is not displayed |
| `className` | (optional) additional class name for the component |
| `popoverTitle` | (optional) title for popover |



---

## `SuccessStatus`

### Summary 

Component for displaying a success status popover.



### Example


```tsx
<SuccessStatus title={successMsg} />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `title` | (optional) status text |
| `iconOnly` | (optional) if true, only displays icon |
| `noTooltip` | (optional) if true, tooltip is not displayed |
| `className` | (optional) additional class name for the component |
| `popoverTitle` | (optional) title for popover |



---

## `checkAccess`

### Summary 

Provides information about user access to a given resource.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resourceAttributes` | resource attributes for access review |
| `impersonate` | impersonation details |



### Returns

Object with resource access information.


---

## `useAccessReview`

### Summary 

Hook that provides information about user access to a given resource.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resourceAttributes` | resource attributes for access review |
| `impersonate` | impersonation details |



### Returns

Array with `isAllowed` and `loading` values.


---

## `useResolvedExtensions`

### Summary 

React hook for consuming Console extensions with resolved `CodeRef` properties.<br/>This hook accepts the same argument(s) as `useExtensions` hook and returns an adapted list of extension instances, resolving all code references within each extension's properties.<br/>Initially, the hook returns an empty array. Once the resolution is complete, the React component is re-rendered with the hook returning an adapted list of extensions.<br/>When the list of matching extensions changes, the resolution is restarted. The hook will continue to return the previous result until the resolution completes.<br/>The hook's result elements are guaranteed to be referentially stable across re-renders.



### Example


```ts
const [navItemExtensions, navItemsResolved] = useResolvedExtensions<NavItem>(isNavItem);
// process adapted extensions and render your component
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `typeGuards` | A list of callbacks that each accept a dynamic plugin extension as an argument and return a boolean flag indicating whether or not the extension meets desired type constraints |



### Returns

Tuple containing a list of adapted extension instances with resolved code references, a boolean flag indicating whether the resolution is complete, and a list of errors detected during the resolution.


---

## `HorizontalNav`

### Summary 

A component that creates a Navigation bar for a page.<br/>Routing is handled as part of the component.<br/>`console.tab/horizontalNav` can be used to add additional content to any horizontal nav.



### Example


```ts
const HomePage: React.FC = (props) => {
    const page = {
      href: '/home',
      name: 'Home',
      component: () => <>Home</>
    }
    return <HorizontalNav pages={[page]} />
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | the resource associated with this Navigation, an object of K8sResourceCommon type |
| `pages` | an array of page objects |



---

## `VirtualizedTable`

### Summary 

A component for making virtualized tables



### Example


```ts
const MachineList: React.FC<MachineListProps> = (props) => {
  return (
    <VirtualizedTable<MachineKind>
     {...props}
     aria-label='Machines'
     columns={getMachineColumns}
     Row={getMachineTableRow}
    />
  );
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `data` | data for table |
| `loaded` | flag indicating data is loaded |
| `loadError` | error object if issue loading data |
| `columns` | column setup |
| `Row` | row setup |
| `unfilteredData` | original data without filter |
| `NoDataEmptyMsg` | (optional) no data empty message component |
| `EmptyMsg` | (optional) empty message component |
| `scrollNode` | (optional) function to handle scroll |
| `label` | (optional) label for table |
| `ariaLabel` | (optional) aria label |
| `gridBreakPoint` | sizing of how to break up grid for responsiveness |
| `onSelect` | (optional) function for handling select of table |
| `rowData` | (optional) data specific to row |
| `sortColumnIndex` | (optional) The index of the column to sort. The default is `0` |
| `sortDirection` | (optional) The direction of the sort. The default is `SortByDirection.asc` |



---

## `TableData`

### Summary 

Component for displaying table data within a table row



### Example


```ts
const PodRow: React.FC<RowProps<K8sResourceCommon>> = ({ obj, activeColumnIDs }) => {
  return (
    <>
      <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
        <ResourceLink kind="Pod" name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      // Important:  the kebab menu cell should include the id and className prop values below
      <TableData id='' className='pf-v5-c-table__action' activeColumnIDs={activeColumnIDs}>
        <MockKebabMenu obj={obj} />
     </TableData>
    </>
  );
};
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `id` | unique id for table |
| `activeColumnIDs` | active columns |
| `className` | (optional) option class name for styling |



---

## `useActiveColumns`

### Summary 

A hook that provides a list of user-selected active TableColumns.



### Example


```tsx
  // See implementation for more details on TableColumn type
  const [activeColumns, userSettingsLoaded] = useActiveColumns({
    columns,
    showNamespaceOverride: false,
    columnManagementID,
  });
  return userSettingsAreLoaded ? <VirtualizedTable columns={activeColumns} {...otherProps} /> : null
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as a key-value in the map |
| `` |  options.columns - An array of all available TableColumns |
| `` |  options.showNamespaceOverride - (optional) If true, a namespace column will be included, regardless of column management selections |
| `` |  options.columnManagementID - (optional) A unique id used to persist and retrieve column management selections to and from user settings. Usually a `group~version~kind` string for a resource. |



### Returns

A tuple containing the current user-selected active columns (a subset of options.columns), and a boolean flag indicating whether user settings have been loaded.


---

## `ListPageHeader`

### Summary 

Component for generating a page header



### Example


```ts
const exampleList: React.FC = () => {
  return (
    <>
      <ListPageHeader title="Example List Page"/>
    </>
  );
};
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `title` | heading title |
| `helpText` | (optional) help section as react node |
| `badge` | (optional) badge icon as react node |



---

## `ListPageCreate`

### Summary 

Component for adding a create button for a specific resource kind that automatically generates a link to the create YAML for this resource.



### Example


```ts
const exampleList: React.FC<MyProps> = () => {
  return (
    <>
      <ListPageHeader title="Example List Page"/>
        <ListPageCreate groupVersionKind={{ group: 'app'; version: 'v1'; kind: 'Deployment' }}>Create Deployment</ListPageCreate>
      </ListPageHeader>
    </>
  );
};
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `groupVersionKind` | group, version, kind of k8s resource `K8sGroupVersionKind` is preferred alternatively can pass reference for group, version, kind which is deprecated i.e `group~version~kind` `K8sResourceKindReference`. Core resources with no API group should leave off the `group` property |



---

## `ListPageCreateLink`

### Summary 

Component for creating a stylized link.



### Example


```ts
const exampleList: React.FC<MyProps> = () => {
 return (
  <>
   <ListPageHeader title="Example Pod List Page"/>
      <ListPageCreateLink to={'/link/to/my/page'}>Create Item</ListPageCreateLink>
   </ListPageHeader>
  </>
 );
};
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `to` | string location where link should direct |
| `createAccessReview` | (optional) object with namespace and kind used to determine access |
| `children` | (optional) children for the component |



---

## `ListPageCreateButton`

### Summary 

Component for creating button.



### Example


```ts
const exampleList: React.FC<MyProps> = () => {
  return (
    <>
      <ListPageHeader title="Example Pod List Page"/>
        <ListPageCreateButton createAccessReview={access}>Create Pod</ListPageCreateButton>
      </ListPageHeader>
    </>
  );
};
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `createAccessReview` | (optional) object with namespace and kind used to determine access |
| `pfButtonProps` | (optional) Patternfly Button props |



---

## `ListPageCreateDropdown`

### Summary 

Component for creating a dropdown wrapped with permissions check.



### Example


```ts
const exampleList: React.FC<MyProps> = () => {
  const items = {
    SAVE: 'Save',
    DELETE: 'Delete',
  }
  return (
    <>
     <ListPageHeader title="Example Pod List Page"/>
       <ListPageCreateDropdown createAccessReview={access} items={items}>Actions</ListPageCreateDropdown>
     </ListPageHeader>
    </>
  );
};
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `items` | key:ReactNode pairs of items to display in dropdown component |
| `onClick` | callback function for click on dropdown items |
| `createAccessReview` | (optional) object with namespace and kind used to determine access |
| `children` | (optional) children for the dropdown toggle |



---

## `ListPageFilter`

### Summary 

Component that generates filter for list page.



### Example


```tsx
  // See implementation for more details on RowFilter and FilterValue types
  const [staticData, filteredData, onFilterChange] = useListPageFilter(
    data,
    [...rowFilters, ...searchFilters],
    staticFilters,
  );
  // ListPageFilter updates filter state based on user interaction and resulting filtered data can be rendered in an independent component.
  return (
    <>
      <ListPageHeader />
      <ListPagBody>
        <ListPageFilter data={staticData} onFilterChange={onFilterChange} rowFilters={rowFilters} rowSearchFilters={searchFilters} />
        <List data={filteredData} />
      </ListPageBody>
    </>
  )
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `data` | An array of data points |
| `loaded` | indicates that data has loaded |
| `onFilterChange` | callback function for when filter is updated |
| `rowFilters` | (optional) An array of RowFilter elements that define the available filter options |
| `labelFilter` | (optional) a unique name key for label filter. This may be useful if there are multiple `ListPageFilter` components rendered at once. |
| `labelPath` | (optional) the path to labels to filter from |
| `nameFilterTitle` | (optional) title for name filter |
| `nameFilterPlaceholder` | (optional) placeholder for name filter |
| `labelFilterPlaceholder` | (optional) placeholder for label filter |
| `hideLabelFilter` | (optional) only shows the name filter instead of both name and label filter |
| `hideNameLabelFilter` | (optional) hides both name and label filter |
| `columnLayout` | (optional) column layout object |
| `hideColumnManagement` | (optional) flag to hide the column management |
| `nameFilter` | (optional) a unique name key for name filter. This may be useful if there are multiple `ListPageFilter` components rendered at once. |
| `rowSearchFilters` | (optional) An array of RowSearchFilters elements that define search text filters added on top of Name and Label filters |



---

## `useListPageFilter`

### Summary 

A hook that manages filter state for the ListPageFilter component.



### Example


```tsx
  // See implementation for more details on RowFilter and FilterValue types
  const [staticData, filteredData, onFilterChange] = useListPageFilter(
    data,
    rowFilters,
    staticFilters,
  );
  // ListPageFilter updates filter state based on user interaction and resulting filtered data can be rendered in an independent component.
  return (
    <>
      <ListPageHeader .../>
      <ListPagBody>
        <ListPageFilter data={staticData} onFilterChange={onFilterChange} />
        <List data={filteredData} />
      </ListPageBody>
    </>
  )
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `data` | An array of data points |
| `rowFilters` | (optional) An array of RowFilter elements that define the available filter options |
| `staticFilters` | (optional) An array of FilterValue elements that are statically applied to the data |



### Returns

A tuple containing the data filtered by all static filteres, the data filtered by all static and row filters, and a callback that updates rowFilters


---

## `ResourceLink`

### Summary 

Component that creates a link to a specific resource type with an icon badge.



### Example


```tsx
  <ResourceLink
      kind="Pod"
      name="testPod"
      title={metadata.uid}
  />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `kind` | (optional) the kind of resource such as Pod, Deployment, Namespace |
| `groupVersionKind` | (optional) object with group, version, and kind |
| `className` | (optional) class style for component |
| `displayName` | (optional) display name for component, overwrites the resource name if set |
| `inline` | (optional) flag to create icon badge and name inline with children |
| `linkTo` | (optional) flag to create a Link object, defaults to true |
| `name` | (optional) name of resource |
| `namespace` | (optional) specific namespace for the kind resource to link to |
| `hideIcon` | (optional) flag to hide the icon badge |
| `title` | (optional) title for the link object (not displayed) |
| `dataTest` | (optional) identifier for testing |
| `onClick` | (optional) callback function for when component is clicked |
| `truncate` | (optional) flag to truncate the link if too long |



---

## `ResourceIcon`

### Summary 

Component that creates an icon badge for a specific resource type.



### Example


```tsx
<ResourceIcon kind="Pod"/>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `kind` | (optional) the kind of resource such as Pod, Deployment, Namespace |
| `groupVersionKind` | (optional) object with group, version, and kind |
| `className` | (optional) class style for component |



---

## `useK8sModel`

### Summary 

Hook that retrieves the k8s model for provided K8sGroupVersionKind from redux.



### Example


```ts
const Component: React.FC = () => {
  const [model, inFlight] = useK8sModel({ group: 'app'; version: 'v1'; kind: 'Deployment' });
  return ...
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `groupVersionKind` | group, version, kind of k8s resource `K8sGroupVersionKind` is preferred alternatively can pass reference for group, version, kind which is deprecated i.e `group~version~kind` `K8sResourceKindReference`. |



### Returns

An array with the first item as k8s model and second item as inFlight status


---

## `useK8sModels`

### Summary 

Hook that retrieves all current k8s models from redux.



### Example


```ts
const Component: React.FC = () => {
  const [models, inFlight] = UseK8sModels();
  return ...
}
```







### Returns

An array with the first item as the list of k8s model and second item as inFlight status


---

## `useK8sWatchResource`

### Summary 

Hook that retrieves the Kubernetes resource along with their respective status for loaded and error.



### Example


```ts
const Component: React.FC = () => {
  const watchRes = {
        ...
      }
  const [data, loaded, error] = useK8sWatchResource(watchRes)
  return ...
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initResource` | resources need to be watched as key-value pair, wherein key will be unique to resource and value will be options needed to watch for the respective resource. |



### Returns

An array with first item as resource(s), second item as loaded status and third item as error state if any.


---

## `useK8sWatchResources`

### Summary 

Hook that retrieves the Kubernetes resources along with their respective status for loaded and error.



### Example


```ts
const Component: React.FC = () => {
  const watchResources = {
        'deployment': {...},
        'pod': {...}
        ...
      }
  const {deployment, pod} = useK8sWatchResources(watchResources)
  return ...
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initResources` | resources need to be watched as key-value pair, wherein key will be unique to resource and value will be options needed to watch for the respective resource. |



### Returns

A map where keys are as provided in initResouces and value has three properties data, loaded and error.


---

## `consoleFetch`

### Summary 

A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.<br/>It also validates the response status code and throws an appropriate error or logs out the user if required.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch |
| `options` | The options to pass to fetch |
| `timeout` | The timeout in milliseconds |



### Returns

A promise that resolves to the response.


---

## `consoleFetchJSON`

### Summary 

A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.<br/>It also validates the response status code and throws an appropriate error or logs out the user if required.<br/>It returns the response as a JSON object.<br/>Uses consoleFetch internally.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch |
| `method` | The HTTP method to use. Defaults to GET |
| `options` | The options to pass to fetch |
| `timeout` | The timeout in milliseconds |



### Returns

A promise that resolves to the response as text or JSON object.


---

## `consoleFetchText`

### Summary 

A custom wrapper around `fetch` that adds console-specific headers and allows for retries and timeouts.<br/>It also validates the response status code and throws an appropriate error or logs out the user if required.<br/>It returns the response as a text.<br/>Uses `consoleFetch` internally.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch |
| `options` | The options to pass to fetch |
| `timeout` | The timeout in milliseconds |



### Returns

A promise that resolves to the response as text or JSON object.


---

## `getConsoleRequestHeaders`

### Summary 

A function that creates impersonation headers for API requests using current redux state.






### Returns

an object containing the appropriate impersonation requst headers, based on redux state


---

## `k8sGetResource`

### Summary 

It fetches a resource from the cluster, based on the provided options.<br/>If the name is provided it returns resource, else it returns all the resources matching the model.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map |
| `` |  options.model - Kubernetes model |
| `` |  options.name - The name of the resource, if not provided then it looks for all the resources matching the model. |
| `` |  options.ns - The namespace to look into, should not be specified for cluster-scoped resources. |
| `` |  options.path - Appends as subpath if provided |
| `` |  options.queryParams - The query parameters to be included in the URL. |
| `` |  options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html |



### Returns

A promise that resolves to the response as JSON object with a resource if the name is provided, else it returns all the resources matching the model. In case of failure, the promise gets rejected with HTTP error response.


---

## `k8sCreateResource`

### Summary 

It creates a resource in the cluster, based on the provided options.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map |
| `` |  options.model - Kubernetes model |
| `` |  options.data - payload for the resource to be created |
| `` |  options.path - Appends as subpath if provided |
| `` |  options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource created.<br/>In case of failure, the promise gets rejected with HTTP error response.


---

## `k8sUpdateResource`

### Summary 

It updates the entire resource in the cluster, based on the provided options.<br/>When a client needs to replace an existing resource entirely, the client can use k8sUpdate.<br/>Alternatively, the client can use k8sPatch to perform the partial update.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | which are passed as key-value pair in the map |
| `` |  options.model - Kubernetes model |
| `` |  options.data - payload for the Kubernetes resource to be updated |
| `` |  options.ns - namespace to look into, it should not be specified for cluster-scoped resources. |
| `` |  options.name - resource name to be updated. |
| `` |  options.path - appends as subpath if provided. |
| `` |  options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource updated.<br/>In case of failure promise gets rejected with HTTP error response.


---

## `k8sPatchResource`

### Summary 

It patches any resource in the cluster, based on the provided options.<br/>When a client needs to perform the partial update, the client can use k8sPatch.<br/>Alternatively, the client can use k8sUpdate to replace an existing resource entirely.<br/>See more https://datatracker.ietf.org/doc/html/rfc6902




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map. |
| `` |  options.model - Kubernetes model |
| `` |  options.resource - The resource to be patched. |
| `` |  options.data - Only the data to be patched on existing resource with the operation, path, and value. |
| `` |  options.path - Appends as subpath if provided. |
| `` |  options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource patched.<br/>In case of failure promise gets rejected with HTTP error response.


---

## `k8sDeleteResource`

### Summary 

It deletes resources from the cluster, based on the provided model and resource.<br/>The garbage collection works based on 'Foreground' | 'Background', can be configured with `propagationPolicy` property in provided model or passed in json.



### Example


```
{ kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | which are passed as key-value pair in the map. |
| `` |  options.model - Kubernetes model |
| `` |  options.resource - The resource to be deleted. |
| `` |  options.path - Appends as subpath if provided. |
| `` |  options.queryParams - The query parameters to be included in the URL. |
| `` |  options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html |
| `` |  options.json - Can control garbage collection of resources explicitly if provided else will default to model's `propagationPolicy`. |



### Returns

A promise that resolves to the response of kind Status.<br/>In case of failure promise gets rejected with HTTP error response.


---

## `k8sListResource`

### Summary 

It lists the resources as an array in the cluster, based on the provided options.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map. |
| `` |  options.model - Kubernetes model |
| `` |  options.queryParams - The query parameters to be included in the URL. It can also pass label selectors by using the `labelSelector` key. |
| `` |  options.requestInit - The fetch init object to use. This can have request headers, method, redirect, and so forth. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html |



### Returns

A promise that resolves to the response


---

## `k8sListResourceItems`

### Summary 

Same interface as k8sListResource but returns the sub items.






---

## `getAPIVersionForModel`

### Summary 

Provides `apiVersion` for a Kubernetes model.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `model` | Kubernetes model |



### Returns

The apiVersion for the model i.e `group/version`.


---

## `getGroupVersionKindForResource`

### Summary 

Provides a group, version, and kind for a resource.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | Kubernetes resource |



### Returns

The group, version, kind for the provided resource.<br/>If the resource does not have an API group, the group `core` is returned.<br/>If the resource has an invalid apiVersion then it'll throw Error.


---

## `getGroupVersionKindForModel`

### Summary 

Provides a group, version, and kind for a k8s model.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `model` | Kubernetes model |



### Returns

The group, version, kind for the provided model.<br/>If the model does not have an apiGroup, group `core` will be returned.


---

## `StatusPopupSection`

### Summary 

Component that shows the status in a popup window. Can be used when building `console.dashboards/overview/health/resource` extensions.



### Example


```tsx
  <StatusPopupSection
    firstColumn={
      <>
        <span>{title}</span>
        <span className="text-secondary">
          My Example Item
        </span>
      </>
    }
    secondColumn='Status'
  >
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `firstColumn` | values for first column of popup |
| `secondColumn` | (optional) values for second column of popup |
| `children` | (optional) children for the popup |



---

## `StatusPopupItem`

### Summary 

Status element used in status popup. Used in in `StatusPopupSection`.



### Example


```tsx
<StatusPopupSection
   firstColumn='Example'
   secondColumn='Status'
>
   <StatusPopupItem icon={healthStateMapping[MCGMetrics.state]?.icon}>
      Complete
   </StatusPopupItem>
   <StatusPopupItem icon={healthStateMapping[RGWMetrics.state]?.icon}>
       Pending
   </StatusPopupItem>
</StatusPopupSection>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `value` | (optional) text value to display |
| `icon` | (optional) icon to display |
| `children` | child elements |



---

## `Overview`

### Summary 

Creates a wrapper component for a dashboard.



### Example


```tsx
    <Overview>
      <OverviewGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Overview>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `className` | (optional) style class for div |
| `children` | (optional) elements of the dashboard |



---

## `OverviewGrid`

### Summary 

Creates a grid of card elements for a dashboard. Used within `Overview`.



### Example


```tsx
    <Overview>
      <OverviewGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Overview>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `mainCards` | cards for grid |
| `leftCards` | (optional) cards for left side of grid |
| `rightCards` | (optional) cards for right side of grid |



---

## `InventoryItem`

### Summary 

Creates an inventory card item.



### Example


```tsx
  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
      <InventoryItemBody error={loadError}>
        {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
      </InventoryItemBody>
    </InventoryItem>
  )
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `children` | elements to render inside the item |



---

## `InventoryItemTitle`

### Summary 

Creates a title for an inventory card item. Used within `InventoryItem`.



### Example


 ```tsx
  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
      <InventoryItemBody error={loadError}>
        {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
      </InventoryItemBody>
    </InventoryItem>
  )
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `children` | elements to render inside the title |



---

## `InventoryItemBody`

### Summary 

Creates the body of an inventory card. Used within `InventoryCard` and can be used with `InventoryTitle`.



### Example


 ```tsx
  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
      <InventoryItemBody error={loadError}>
        {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
      </InventoryItemBody>
    </InventoryItem>
  )
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `children` | elements to render inside the inventory card or title |
| `error` | elements of the div |



---

## `InventoryItemStatus`

### Summary 

Creates a count and icon for an inventory card with optional link address. Used within `InventoryItemBody`.



### Example


 ```tsx
  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
      <InventoryItemBody error={loadError}>
        {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
      </InventoryItemBody>
    </InventoryItem>
  )
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `count` | count for display |
| `icon` | icon for display |
| `linkTo` | (optional) link address |



---

## `InventoryItemLoading`

### Summary 

Creates a skeleton container for when an inventory card is loading. Used with `InventoryItem` and related components.



### Example


```tsx
if (loadError) {
   title = <Link to={workerNodesLink}>{t('Worker Nodes')}</Link>;
} else if (!loaded) {
  title = <><InventoryItemLoading /><Link to={workerNodesLink}>{t('Worker Nodes')}</Link></>;
}
return (
  <InventoryItem>
    <InventoryItemTitle>{title}</InventoryItemTitle>
  </InventoryItem>
)
```







---

## `useFlag`

### Summary 

Hook that returns the given feature flag from FLAGS redux state.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `flag` | The feature flag to return |



### Returns

the boolean value of the requested feature flag or undefined


---

## `CodeEditor`

### Summary 

A basic lazy loaded Code editor with hover help and completion.



### Example


```tsx
<React.Suspense fallback={<LoadingBox />}>
  <CodeEditor
    value={code}
    language="yaml"
  />
</React.Suspense>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `value` | String representing the yaml code to render. |
| `language` | String representing the language of the editor. |
| `options` | Monaco editor options. For more details, please, visit https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneEditorConstructionOptions.html. |
| `minHeight` | Minimum editor height in valid CSS height values. |
| `showShortcuts` | Boolean to show shortcuts on top of the editor. |
| `toolbarLinks` | Array of ReactNode rendered on the toolbar links section on top of the editor. |
| `onChange` | Callback for on code change event. |
| `onSave` | Callback called when the command CTRL / CMD + S is triggered. |
| `ref` | React reference to `{ editor?: IStandaloneCodeEditor }`. Using the 'editor' property, you are able to access to all methods to control the editor. For more information, visit https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneCodeEditor.html. |



---

## `ResourceYAMLEditor`

### Summary 

A lazy loaded YAML editor for Kubernetes resources with hover help and completion.<br/>The component uses the YAML editor and adds functionality, such as<br/>resource update handling, alerts, save; cancel and reload buttons; and accessibility.<br/>Unless `onSave` callback is provided, the resource update is automatically handled.<br/>It should be wrapped in a `React.Suspense` component.



### Example


```tsx
<React.Suspense fallback={<LoadingBox />}>
  <ResourceYAMLEditor
    initialResource={resource}
    header="Create resource"
    onSave={(content) => updateResource(content)}
  />
</React.Suspense>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initialResource` | YAML/Object representing a resource to be shown by the editor. This prop is used only during the inital render. |
| `header` | Add a header on top of the YAML editor. |
| `onSave` | Callback for the Save button. Passing it will override the default update performed on the resource by the editor. |
| `readOnly` | Sets the YAML editor to read-only mode. |
| `create` | Editor will be on creation mode. Create button will replace the Save and Cancel buttons. If no onSave method defined, the 'Create' button will trigger the creation of the defined resource. Default: false |
| `onChange` | Callback triggered at any editor change. |
| `hideHeader` | On creation mode the editor by default show an header that can be hided with this property |



---

## `ResourceEventStream`

### Summary 

A component to show events related to a particular resource.



### Example


```tsx
const [resource, loaded, loadError] = useK8sWatchResource(clusterResource);
return <ResourceEventStream resource={resource} />
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | An object whose related events should be shown. |



---

## `usePrometheusPoll`

### Summary 

Sets up a poll to Prometheus for a single query.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `endpoint` | one of the PrometheusEndpoint (label, query, range, rules, targets) |
| `query` | (optional) Prometheus query string. If empty or undefined, polling is not started. |
| `delay` | (optional) polling delay interval (ms) |
| `endTime` | (optional) for QUERY_RANGE enpoint, end of the query range |
| `samples` | (optional) for QUERY_RANGE enpoint |
| `timespan` | (optional) for QUERY_RANGE enpoint |
| `namespace` | (optional) a search param to append |
| `timeout` | (optional) a search param to append |



### Returns

A tuple containing the query response, a boolean flag indicating whether the response has completed, and any errors encountered during the request or post-processing of the request


---

## `Timestamp`

### Summary 

A component to render timestamp.<br/>The timestamps are synchronized between individual instances of the Timestamp component.<br/>The provided timestamp is formatted according to user locale.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `timestamp` | the timestamp to render. Format is expected to be ISO 8601 (used by Kubernetes), epoch timestamp, or an instance of a Date. |
| `simple` | render simple version of the component omitting icon and tooltip. |
| `omitSuffix` | formats the date ommiting the suffix. |
| `className` | additional class name for the component. |



---

## `useModal`

### Summary 

A hook to launch Modals.



### Example


```tsx
const AppPage: React.FC = () => {
 const launchModal = useModal();
 const onClick = () => launchModal(ModalComponent);
 return (
   <Button onClick={onClick}>Launch a Modal</Button>
 )
}
```







---

## `ActionServiceProvider`

### Summary 

Component that allows to receive contributions from other plugins for the `console.action/provider` extension type.<br/>See docs: https://github.com/openshift/console/blob/master/frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md#consoleactionprovider



### Example


```tsx
   const context: ActionContext = { 'a-context-id': { dataFromDynamicPlugin } };

   ...

   <ActionServiceProvider context={context}>
       {({ actions, options, loaded }) =>
         loaded && (
           <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
         )
       }
   </ActionServiceProvider>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `context` | Object with contextId and optional plugin data |



---

## `NamespaceBar`

### Summary 

A component that renders a horizontal toolbar with a namespace dropdown menu in the leftmost position. Additional components can be passed in as children and will be rendered to the right of the namespace dropdown. This component is designed to be used at the top of the page. It should be used on pages where the user needs to be able to change the active namespace, such as on pages with k8s resources.



### Example


```tsx
   const logNamespaceChange = (namespace) => console.log(`New namespace: ${namespace}`);

   ...

   <NamespaceBar onNamespaceChange={logNamespaceChange}>
     <NamespaceBarApplicationSelector />
   </NamespaceBar>
   <Page>

     ...
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `onNamespaceChange` | (optional) A function that is executed when a namespace option is selected. It accepts the new namespace in the form of a string as its only argument. The active namespace is updated automatically when an option is selected, but additional logic can be applied through this function. When the namespace is changed, the namespace parameter in the URL will be changed from the previous namespace to the newly selected namespace. |
| `isDisabled` | (optional) A boolean flag that disables the namespace dropdown if set to true. This option only applies to the namespace dropdown and has no effect on child components. |
| `children` | (optional) Additional elements to be rendered inside the toolbar to the right of the namespace dropdown. |



---

## `ErrorBoundaryFallbackPage`

### Summary 

Creates a full page ErrorBoundaryFallbackPage component to display the "Oh no! Something went wrong." message along with the stack trace and other helpful debugging information.<br/>This is to be used in conjunction with an `ErrorBoundary` component.



### Example


 ```tsx
 //in ErrorBoundary component
  return (
    if (this.state.hasError) {
      return <ErrorBoundaryFallbackPage errorMessage={errorString} componentStack={componentStackString}
       stack={stackTraceString} title={errorString}/>;
    }

    return this.props.children;
  }
 )
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `errorMessage` | text description of the error message |
| `componentStack` | component trace of the exception |
| `stack` | stack trace of the exception |
| `title` | title to render as the header of the error boundary page |



---

## `QueryBrowser`

### Summary 

A component that renders a graph of the results from a Prometheus PromQL query along with controls for interacting with the graph.



### Example


```tsx
<QueryBrowser
  defaultTimespan={15 * 60 * 1000}
  namespace={namespace}
  pollInterval={30 * 1000}
  queries={[
    'process_resident_memory_bytes{job="console"}',
    'sum(irate(container_network_receive_bytes_total[6h:5m])) by (pod)',
  ]}
/>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `customDataSource` | (optional) Base URL of an API endpoint that handles PromQL queries. If provided, this is used instead of the default API for fetching data. |
| `defaultSamples` | (optional) The default number of data samples plotted for each data series. If there are many data series, QueryBrowser might automatically pick a lower number of data samples than specified here. |
| `defaultTimespan` | (optional) The default timespan for the graph in milliseconds - defaults to 1,800,000 (30 minutes). |
| `disabledSeries` | (optional) Disable (don't display) data series with these exact label / value pairs. |
| `disableZoom` | (optional) Flag to disable the graph zoom controls. |
| `filterLabels` | (optional) Optionally filter the returned data series to only those that match these label / value pairs. |
| `fixedEndTime` | (optional) Set the end time for the displayed time range rather than showing data up to the current time. |
| `formatSeriesTitle` | (optional) Function that returns a string to use as the title for a single data series. |
| `GraphLink` | (optional) Component for rendering a link to another page (for example getting more information about this query). |
| `hideControls` | (optional) Flag to hide the graph controls for changing the graph timespan, and so on. |
| `isStack` | (optional) Flag to display a stacked graph instead of a line graph. If showStackedControl is set, it will still be possible for the user to switch to a line graph. |
| `namespace` | (optional) If provided, data is only returned for this namespace (only series that have this namespace label). |
| `onZoom` | (optional) Callback called when the graph is zoomed. |
| `pollInterval` | (optional) If set, determines how often the graph is updated to show the latest data (in milliseconds). |
| `queries` | Array of PromQL queries to run and display the results in the graph. |
| `showLegend` | (optional) Flag to enable displaying a legend below the graph. |
| `showStackedControl` | Flag to enable displaying a graph control for switching between stacked graph mode and line graph mode. |
| `timespan` | (optional) The timespan that should be covered by the graph in milliseconds. |
| `units` | (optional) Units to display on the Y-axis and in the tooltip. |



---

## `useAnnotationsModal`

### Summary 

A hook that provides a callback to launch a modal for editing Kubernetes resource annotations.



### Example


```tsx
const PodAnnotationsButton = ({ pod }) => {
  const { t } = useTranslation();
  const launchAnnotationsModal = useAnnotationsModal(pod);
  return <button onClick={launchAnnotationsModal}>{t('Edit Pod Annotations')}</button>
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | The resource to edit annotations for, an object of K8sResourceCommon type. |



### Returns

A function which will launch a modal for editing a resource's annotations.


---

## `useDeleteModal`

### Summary 

A hook that provides a callback to launch a modal for deleting a resource.



### Example


```tsx
const DeletePodButton = ({ pod }) => {
  const { t } = useTranslation();
  const launchDeleteModal = useDeleteModal(pod);
  return <button onClick={launchDeleteModal}>{t('Delete Pod')}</button>
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | The resource to delete. |
| `redirectTo` | (optional) A location to redirect to after deleting the resource. |
| `message` | (optional) A message to display in the modal. |
| `btnText` | (optional) The text to display on the delete button. |
| `deleteAllResources` | (optional) A function to delete all resources of the same kind. |



### Returns

A function which will launch a modal for deleting a resource.


---

## `useLabelsModal`

### Summary 

A hook that provides a callback to launch a modal for editing Kubernetes resource labels.



### Example


```tsx
const PodLabelsButton = ({ pod }) => {
  const { t } = useTranslation();
  const launchLabelsModal = useLabelsModal(pod);
  return <button onClick={launchLabelsModal}>{t('Edit Pod Labels')}</button>
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | The resource to edit labels for, an object of K8sResourceCommon type. |



### Returns

A function which will launch a modal for editing a resource's labels.


---

## `useActiveNamespace`

### Summary 

Hook that provides the currently active namespace and a callback for setting the active namespace.



### Example


```tsx
const Component: React.FC = (props) => {
   const [activeNamespace, setActiveNamespace] = useActiveNamespace();
   return <select
     value={activeNamespace}
     onChange={(e) => setActiveNamespace(e.target.value)}
   >
     {
       // ...namespace options
     }
   </select>
}
```







### Returns

A tuple containing the current active namespace and setter callback.


---

## `useUserSettings`

### Summary 

Hook that provides a user setting value and a callback for setting the user setting value.



### Example


```tsx
const Component: React.FC = (props) => {
   const [state, setState, loaded] = useUserSettings(
     'devconsole.addPage.showDetails',
     true,
     true,
   );
   return loaded ? (
      <WrappedComponent {...props} userSettingState={state} setUserSettingState={setState} />
    ) : null;
};
```







### Returns

A tuple containing the user setting value, a setter callback, and a loaded boolean.


---

## `useQuickStartContext`

### Summary 

Hook that provides the current quick start context values. This allows plugins to interop with Console<br/>quick start functionality.



### Example


```tsx
const OpenQuickStartButton = ({ quickStartId }) => {
   const { setActiveQuickStart } = useQuickStartContext();
   const onClick = React.useCallback(() => {
       setActiveQuickStart(quickStartId);
   }, [quickStartId]);
   return <button onClick={onClick}>{t('Open Quick Start')}</button>
};
```







### Returns

Quick start context values object.


---

## `PerspectiveContext`

### Summary [DEPRECATED]

@deprecated - use the provided `usePerspectiveContext` instead<br/>Creates the perspective context




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `PerspectiveContextType` | object with active perspective and setter |



### Returns

React context


---

## `useAccessReviewAllowed`

### Summary [DEPRECATED]

@deprecated - Use useAccessReview from \@console/dynamic-plugin-sdk instead.<br/>Hook that provides allowed status about user access to a given resource.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resourceAttributes` | resource attributes for access review |
| `impersonate` | impersonation details |



### Returns

The isAllowed boolean value.


---

## `useSafetyFirst`

### Summary [DEPRECATED]

@deprecated - This hook is not related to console functionality.<br/>Hook that ensures a safe asynchronnous setting of the React state in case a given component could be unmounted.<br/>(https://github.com/facebook/react/issues/14113)




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initialState` | initial state value |



### Returns

An array with a pair of state value and it's set function.


---

## `YAMLEditor`

### Summary [DEPRECATED]

@deprecated Use [CodeEditor](#codeeditor) instead.<br/>A basic lazy loaded YAML editor with hover help and completion.



### Example


```tsx
<React.Suspense fallback={<LoadingBox />}>
  <YAMLEditor
    value={code}
  />
</React.Suspense>
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `value` | String representing the yaml code to render. |
| `language` | String representing the language of the editor. |
| `options` | Monaco editor options. For more details, see https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneEditorConstructionOptions.html. |
| `minHeight` | Minimum editor height in valid CSS height values. |
| `showShortcuts` | Boolean to show shortcuts on top of the editor. |
| `toolbarLinks` | Array of ReactNode rendered on the toolbar links section on top of the editor. |
| `onChange` | Callback for on code change event. |
| `onSave` | Callback called when the command `CTRL + S` / `CMD + S` is triggered. |
| `ref` | React reference to `{ editor?: IStandaloneCodeEditor }`. Using the 'editor' property, you are able to access to all methods to control the editor. For more information, see https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneCodeEditor.html. |



