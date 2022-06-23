# OpenShift Console API

1. [`useActivePerspective`](#useactiveperspective)
2. [`PerspectiveContext`](#perspectivecontext)
3. [`GreenCheckCircleIcon`](#greencheckcircleicon)
4. [`RedExclamationCircleIcon`](#redexclamationcircleicon)
5. [`YellowExclamationTriangleIcon`](#yellowexclamationtriangleicon)
6. [`BlueInfoCircleIcon`](#blueinfocircleicon)
7. [`ErrorStatus`](#errorstatus)
8. [`InfoStatus`](#infostatus)
9. [`ProgressStatus`](#progressstatus)
10. [`SuccessStatus`](#successstatus)
11. [`checkAccess`](#checkaccess)
12. [`useAccessReview`](#useaccessreview)
13. [`useAccessReviewAllowed`](#useaccessreviewallowed)
14. [`useSafetyFirst`](#usesafetyfirst)
15. [`useResolvedExtensions`](#useresolvedextensions)
16. [`HorizontalNav`](#horizontalnav)
17. [`VirtualizedTable`](#virtualizedtable)
18. [`TableData`](#tabledata)
19. [`useActiveColumns`](#useactivecolumns)
20. [`ListPageHeader`](#listpageheader)
21. [`ListPageCreate`](#listpagecreate)
22. [`ListPageCreateLink`](#listpagecreatelink)
23. [`ListPageCreateButton`](#listpagecreatebutton)
24. [`ListPageCreateDropdown`](#listpagecreatedropdown)
25. [`ListPageFilter`](#listpagefilter)
26. [`useListPageFilter`](#uselistpagefilter)
27. [`ResourceLink`](#resourcelink)
28. [`useK8sModel`](#usek8smodel)
29. [`useK8sModels`](#usek8smodels)
30. [`useK8sWatchResource`](#usek8swatchresource)
31. [`useK8sWatchResources`](#usek8swatchresources)
32. [`consoleFetch`](#consolefetch)
33. [`consoleFetchJSON`](#consolefetchjson)
34. [`consoleFetchText`](#consolefetchtext)
35. [`getConsoleRequestHeaders`](#getconsolerequestheaders)
36. [`k8sGetResource`](#k8sgetresource)
37. [`k8sCreateResource`](#k8screateresource)
38. [`k8sUpdateResource`](#k8supdateresource)
39. [`k8sPatchResource`](#k8spatchresource)
40. [`k8sDeleteResource`](#k8sdeleteresource)
41. [`k8sListResource`](#k8slistresource)
42. [`k8sListResourceItems`](#k8slistresourceitems)
43. [`getAPIVersionForModel`](#getapiversionformodel)
44. [`getGroupVersionKindForResource`](#getgroupversionkindforresource)
45. [`getGroupVersionKindForModel`](#getgroupversionkindformodel)
46. [`StatusPopupSection`](#statuspopupsection)
47. [`StatusPopupItem`](#statuspopupitem)
48. [`Overview`](#overview)
49. [`OverviewGrid`](#overviewgrid)
50. [`InventoryItem`](#inventoryitem)
51. [`InventoryItemTitle`](#inventoryitemtitle)
52. [`InventoryItemBody`](#inventoryitembody)
53. [`InventoryItemStatus`](#inventoryitemstatus)
54. [`InventoryItemLoading`](#inventoryitemloading)
55. [`useFlag`](#useflag)
56. [`ResourceYAMLEditor`](#resourceyamleditor)
57. [`ResourceEventStream`](#resourceeventstream)
58. [`usePrometheusPoll`](#useprometheuspoll)
59. [`Timestamp`](#timestamp)

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

## `PerspectiveContext`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/perspective/perspective-context.ts)






---

## `GreenCheckCircleIcon`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)






---

## `RedExclamationCircleIcon`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)






---

## `YellowExclamationTriangleIcon`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)






---

## `BlueInfoCircleIcon`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)






---

## `ErrorStatus`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)






---

## `InfoStatus`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)






---

## `ProgressStatus`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)






---

## `SuccessStatus`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)






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

Array with isAllowed and loading values.


---

## `useAccessReviewAllowed`

### Summary

Hook that provides allowed status about user access to a given resource.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resourceAttributes` | resource attributes for access review |
| `impersonate` | impersonation details |



### Returns

The isAllowed boolean value.


---

## `useSafetyFirst`

### Summary

Hook that ensures a safe asynchronnous setting of React state in case a given component could be unmounted.<br/>(https://github.com/facebook/react/issues/14113)




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initialState` | initial state value |



### Returns

An array with a pair of state value and it's set function.


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

A component that creates a Navigation bar. It takes array of NavPage objects and renderes a NavBar.<br/>Routing is handled as part of the component.



### Example


```ts
const HomePage: React.FC = (props) => {
    const page = {
      href: '/home',
      name: 'Home',
      component: () => <>Home</>
    }
    return <HorizontalNav match={props.match} pages={[page]} />
}
```






### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | The resource associated with this Navigation, an object of K8sResourceCommon type |
| `pages` | An array of page objects |
| `match` | match object provided by React Router |



---

## `VirtualizedTable`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/Table/VirtualizedTable.tsx)






---

## `TableData`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/Table/VirtualizedTable.tsx)






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
| `options` | Which are passed as a key-value map |
| `` |  options.columns - An array of all available TableColumns |
| `` |  options.showNamespaceOverride - (optional) If true, a namespace column will be included, regardless of column management selections |
| `` |  options.columnManagementID - (optional) A unique id used to persist and retrieve column management selections to and from user settings. Usually a 'group~verion~kind' string for a resource. |



### Returns

A tuple containing the current user selected active columns (a subset of options.columns), and a boolean flag indicating whether user settings have been loaded.


---

## `ListPageHeader`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/ListPage/ListPageHeader.tsx)






---

## `ListPageCreate`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/ListPage/ListPageCreate.tsx)






---

## `ListPageCreateLink`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/ListPage/ListPageCreate.tsx)






---

## `ListPageCreateButton`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/ListPage/ListPageCreate.tsx)






---

## `ListPageCreateDropdown`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/ListPage/ListPageCreate.tsx)






---

## `ListPageFilter`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/public/components/factory/ListPage/ListPageFilter.tsx)






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

Component that creates a link to a specific resource type with an icon badge



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
| `kind` | (optional) the kind of resource i.e. Pod, Deployment, Namespace |
| `groupVersionKind` | (optional) object with groupd, version, and kind |
| `className` | (optional) class style for component |
| `displayName` | (optional) display name for component, overwrites the resource name if set |
| `inline` | (optional) flag to create icon badge and name inline with children |
| `linkTo` | (optional) flag to create a Link object - defaults to true |
| `name` | (optional) name of resource |
| `namesapce` | (optional) specific namespace for the kind resource to link to |
| `hideIcon` | (optional) flag to hide the icon badge |
| `title` | (optional) title for the link object (not displayed) |
| `dataTest` | (optional) identifier for testing |
| `onClick` | (optional) callback function for when component is clicked |
| `truncate` | (optional) flag to truncate the link if too long |



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
| `groupVersionKind` | group, version, kind of k8s resource {@link K8sGroupVersionKind} is preferred alternatively can pass reference for group, version, kind which is deprecated i.e `group~version~kind` {@link K8sResourceKindReference}. |



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

Hook that retrieves the k8s resource along with status for loaded and error.



### Example


```ts
const Component: React.FC = () => {
  const watchRes = {
        ...
      }
  const [data, loaded, error] = UseK8sWatchResource(watchRes)
  return ...
}
```





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initResource` | options needed to watch for resource. |



### Returns

An array with first item as resource(s), second item as loaded status and third item as error state if any.


---

## `useK8sWatchResources`

### Summary

Hook that retrieves the k8s resources along with their respective status for loaded and error.



### Example


```ts
const Component: React.FC = () => {
  const watchResources = {
        'deployment': {...},
        'pod': {...}
        ...
      }
  const {deployment, pod}  = UseK8sWatchResources(watchResources)
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

A custom wrapper around `fetch` that adds console specific headers and allows for retries and timeouts.<br/>It also validates the response status code and throws appropriate error or logs out the user if required.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch |
| `options` | The options to pass to fetch |
| `timeout` | The timeout in milliseconds |



### Returns

A promise that resolves to the response


---

## `consoleFetchJSON`

### Summary

A custom wrapper around `fetch` that adds console specific headers and allows for retries and timeouts.<br/>It also validates the response status code and throws appropriate error or logs out the user if required.<br/>It returns the response as a JSON object.<br/>Uses consoleFetch internally.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch |
| `method` | The HTTP method to use. Defaults to GET |
| `options` | The options to pass to fetch |
| `timeout` | The timeout in milliseconds |
| `cluster` | The name of the cluster to make the request to. Defaults to the active cluster the user has selected |



### Returns

A promise that resolves to the response as JSON object.


---

## `consoleFetchText`

### Summary

A custom wrapper around `fetch` that adds console specific headers and allows for retries and timeouts.<br/>It also validates the response status code and throws appropriate error or logs out the user if required.<br/>It returns the response as a text.<br/>Uses consoleFetch internally.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch |
| `options` | The options to pass to fetch |
| `timeout` | The timeout in milliseconds |
| `cluster` | The name of the cluster to make the request to. Defaults to the active cluster the user has selected |



### Returns

A promise that resolves to the response as text.


---

## `getConsoleRequestHeaders`

### Summary

A function that creates impersonation and multicluster related headers for API requests using current redux state.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `targetCluster` | override the current active cluster with the provided targetCluster |



### Returns

an object containing the appropriate impersonation and clustr requst headers, based on redux state


---

## `k8sGetResource`

### Summary

It fetches a resource from the cluster, based on the provided options.<br/>If the name is provided it returns one resource else it returns all the resources matching the model.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map |
| `` |  options.model - k8s model |
| `` |  options.name - The name of the resource, if not provided then it'll look for all the resources matching the model. |
| `` |  options.ns - The namespace to look into, should not be specified for cluster-scoped resources. |
| `` |  options.path - Appends as subpath if provided |
| `` |  options.queryParams - The query parameters to be included in the URL. |
| `` |  options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc.See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
 |



### Returns

A promise that resolves to the response as JSON object with a resource if the name is provided<br/>else it returns all the resources matching the model. In case of failure, the promise gets rejected with HTTP error response.


---

## `k8sCreateResource`

### Summary

It creates a resource in the cluster, based on the provided options.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map |
| `` |  options.model - k8s model |
| `` |  options.data - payload for the resource to be created |
| `` |  options.path - Appends as subpath if provided |
| `` |  options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource created.<br/>In case of failure promise gets rejected with HTTP error response.


---

## `k8sUpdateResource`

### Summary

It updates the entire resource in the cluster, based on provided options.<br/>When a client needs to replace an existing resource entirely, they can use k8sUpdate.<br/>Alternatively can use k8sPatch to perform the partial update.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | which are passed as key-value pair in the map |
| `` |  options.model - k8s model |
| `` |  options.data - payload for the k8s resource to be updated |
| `` |  options.ns - namespace to look into, it should not be specified for cluster-scoped resources. |
| `` |  options.name - resource name to be updated. |
| `` |  options.path - Appends as subpath if provided |
| `` |  options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource updated.<br/>In case of failure promise gets rejected with HTTP error response.


---

## `k8sPatchResource`

### Summary

It patches any resource in the cluster, based on provided options.<br/>When a client needs to perform the partial update, they can use k8sPatch.<br/>Alternatively can use k8sUpdate to replace an existing resource entirely.<br/>See more https://datatracker.ietf.org/doc/html/rfc6902




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map. |
| `` |  options.model - k8s model |
| `` |  options.resource - The resource to be patched. |
| `` |  options.data - Only the data to be patched on existing resource with the operation, path, and value. |
| `` |  options.path - Appends as subpath if provided. |
| `` |  options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource patched.<br/>In case of failure promise gets rejected with HTTP error response.


---

## `k8sDeleteResource`

### Summary

It deletes resources from the cluster, based on the provided model, resource.<br/>The garbage collection works based on 'Foreground' | 'Background', can be configured with propagationPolicy property in provided model or passed in json.



### Example


{ kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }





### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | which are passed as key-value pair in the map. |
| `` |  options.model - k8s model |
| `` |  options.resource - The resource to be deleted. |
| `` |  options.path - Appends as subpath if provided |
| `` |  options.queryParams - The query parameters to be included in the URL. |
| `` |  options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc.See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
 |
| `` |  options.json - Can control garbage collection of resources explicitly if provided else will default to model's "propagationPolicy". |



### Returns

A promise that resolves to the response of kind Status.<br/>In case of failure promise gets rejected with HTTP error response.


---

## `k8sListResource`

### Summary

It lists the resources as an array in the cluster, based on provided options.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map |
| `` |  options.model - k8s model |
| `` |  options.queryParams - The query parameters to be included in the URL and can pass label selector's as well with key "labelSelector". |
| `` |  options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc.See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
 |



### Returns

A promise that resolves to the response


---

## `k8sListResourceItems`

### Summary

Same interface as {@link k8sListResource} but returns the sub items.






---

## `getAPIVersionForModel`

### Summary

Provides apiVersion for a k8s model.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `model` | k8s model |



### Returns

The apiVersion for the model i.e `group/version`.


---

## `getGroupVersionKindForResource`

### Summary

Provides a group, version, and kind for a resource.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | k8s resource |



### Returns

The group, version, kind for the provided resource.<br/>If the resource does not have an API group, group "core" will be returned.<br/>If the resource has an invalid apiVersion then it'll throw Error.


---

## `getGroupVersionKindForModel`

### Summary

Provides a group, version, and kind for a k8s model.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `model` | k8s model |



### Returns

The group, version, kind for the provided model.<br/>If the model does not have an apiGroup, group "core" will be returned.


---

## `StatusPopupSection`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/status-card/StatusPopup.tsx)






---

## `StatusPopupItem`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/status-card/StatusPopup.tsx)






---

## `Overview`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/Dashboard.tsx)






---

## `OverviewGrid`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/DashboardGrid.tsx)






---

## `InventoryItem`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/inventory-card/InventoryCard.tsx)






---

## `InventoryItemTitle`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/inventory-card/InventoryCard.tsx)






---

## `InventoryItemBody`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/inventory-card/InventoryCard.tsx)






---

## `InventoryItemStatus`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/inventory-card/InventoryCard.tsx)






---

## `InventoryItemLoading`

### Summary

[For more details please refer the implementation](https://github.com/openshift/console/tree/release-4.11/frontend/packages/console-shared/src/components/dashboard/inventory-card/InventoryCard.tsx)






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

## `ResourceYAMLEditor`

### Summary

A lazy loaded YAML editor for Kubernetes resources with hover help and completion.<br/>The editor will handle updating the resource when the user clicks save unless an onSave handler is provided.<br/>It should be wrapped in a React.Suspense component.



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
| `initialResource` | YAML/Object representing a resource to be shown by the editor.This prop is used only during the inital render
 |
| `header` | Add a header on top of the YAML editor |
| `onSave` | Callback for the Save button.Passing it will override the default update performed on the resource by the editor
 |



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
| `` |  {ResourceEventStreamProps['resource']} - An object whose related events should be shown. |



---

## `usePrometheusPoll`

### Summary

React hook to poll Prometheus for a single query.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which is passed as a key-value map |
| `` |  options.query - Prometheus query string. If empty or undefined, polling is not started. |
| `` |  options.delay - polling delay interval (ms) |
| `` |  options.endpoint - one of the PrometheusEndpoint (label, query, range, rules, targets) |
| `` |  options.endTime - for QUERY_RANGE enpoint, end of the query range |
| `` |  options.samples - for QUERY_RANGE enpoint |
| `` |  options.timespan - for QUERY_RANGE enpoint |
| `` |  options.namespace - a search param to append |
| `` |  options.timeout - a search param to append |



### Returns

A tuple containing the query response, a boolean flag indicating whether the response has completed, and any errors encountered during the request or post-processing of the request


---

## `Timestamp`

### Summary

A component to render timestamp.<br/>The timestamps are synchronized between invidual instances of the Timestamp component.<br/>The provided timestamp is formatted according to user locale.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `timestamp` | the timestamp to render. Format is expected to be ISO 8601 (used by Kubernetes), epoch timestamp, or an instance of a Date. |
| `simple` | render simple version of the component omitting icon and tooltip. |
| `omitSuffix` | formats the date ommiting the suffix. |
| `className` | additional class name for the component. |



