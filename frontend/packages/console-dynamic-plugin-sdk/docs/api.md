# OpenShift Console API

| API kind | Exposed APIs |
| -------- | ------------ |
| Variable (81) | [ActionServiceProvider](#actionserviceprovider), [BlueInfoCircleIcon](#blueinfocircleicon), [CamelCaseWrap](#camelcasewrap), [checkAccess](#checkaccess), [CodeEditor](#codeeditor), [consoleFetch](#consolefetch), [consoleFetchJSON](#consolefetchjson), [consoleFetchText](#consolefetchtext), [DocumentTitle](#documenttitle), [ErrorBoundaryFallbackPage](#errorboundaryfallbackpage), [ErrorStatus](#errorstatus), [GenericStatus](#genericstatus), [getAPIVersionForModel](#getapiversionformodel), [getGroupVersionKindForModel](#getgroupversionkindformodel), [getGroupVersionKindForResource](#getgroupversionkindforresource), [GreenCheckCircleIcon](#greencheckcircleicon), [HorizontalNav](#horizontalnav), [InfoStatus](#infostatus), [InventoryItem](#inventoryitem), [InventoryItemBody](#inventoryitembody), [InventoryItemLoading](#inventoryitemloading), [InventoryItemStatus](#inventoryitemstatus), [InventoryItemTitle](#inventoryitemtitle), [isAllNamespacesKey](#isallnamespaceskey), [k8sCreate](#k8screate), [k8sDelete](#k8sdelete), [k8sGet](#k8sget), [k8sList](#k8slist), [k8sListItems](#k8slistitems), [k8sPatch](#k8spatch), [k8sUpdate](#k8supdate), [ListPageBody](#listpagebody), [ListPageCreate](#listpagecreate), [ListPageCreateButton](#listpagecreatebutton), [ListPageCreateDropdown](#listpagecreatedropdown), [ListPageCreateLink](#listpagecreatelink), [ListPageHeader](#listpageheader), [NamespaceBar](#namespacebar), [Overview](#overview), [OverviewGrid](#overviewgrid), [PopoverStatus](#popoverstatus), [ProgressStatus](#progressstatus), [QueryBrowser](#querybrowser), [RedExclamationCircleIcon](#redexclamationcircleicon), [ResourceEventStream](#resourceeventstream), [ResourceIcon](#resourceicon), [ResourceLink](#resourcelink), [ResourceStatus](#resourcestatus), [ResourceYAMLEditor](#resourceyamleditor), [StatusComponent](#statuscomponent), [StatusIconAndText](#statusiconandtext), [StatusPopupItem](#statuspopupitem), [StatusPopupSection](#statuspopupsection), [SuccessStatus](#successstatus), [TableData](#tabledata), [Timestamp](#timestamp), [useAccessReview](#useaccessreview), [useActiveColumns](#useactivecolumns), [useActiveNamespace](#useactivenamespace), [useActivePerspective](#useactiveperspective), [useAnnotationsModal](#useannotationsmodal), [useDeleteModal](#usedeletemodal), [useFlag](#useflag), [useK8sModel](#usek8smodel), [useK8sModels](#usek8smodels), [useK8sWatchResource](#usek8swatchresource), [useK8sWatchResources](#usek8swatchresources), [useLabelsModal](#uselabelsmodal), [useOverlay](#useoverlay), [usePrometheusPoll](#useprometheuspoll), [useQuickStartContext](#usequickstartcontext), [useResolvedExtensions](#useresolvedextensions), [useUserSettings](#useusersettings), [YellowExclamationTriangleIcon](#yellowexclamationtriangleicon), [ListPageFilter](#listpagefilter), [PerspectiveContext](#perspectivecontext), [useAccessReviewAllowed](#useaccessreviewallowed), [useListPageFilter](#uselistpagefilter), [useModal](#usemodal), [VirtualizedTable](#virtualizedtable), [YAMLEditor](#yamleditor) |
| TypeAlias (27) | [Alert](#alert), [Alerts](#alerts), [ColoredIconProps](#colorediconprops), [DiscoveryResources](#discoveryresources), [ExtensionHook](#extensionhook), [ExtensionHookResult](#extensionhookresult), [ExtensionK8sGroupKindModel](#extensionk8sgroupkindmodel), [ExtensionK8sGroupModel](#extensionk8sgroupmodel), [ExtensionK8sKindVersionModel](#extensionk8skindversionmodel), [ExtensionK8sModel](#extensionk8smodel), [K8sModel](#k8smodel), [K8sVerb](#k8sverb), [MatchExpression](#matchexpression), [MatchLabels](#matchlabels), [ModalComponent](#modalcomponent), [OverlayComponent](#overlaycomponent), [PerspectiveContextType](#perspectivecontexttype), [PrometheusAlert](#prometheusalert), [PrometheusLabels](#prometheuslabels), [PrometheusRule](#prometheusrule), [PrometheusRulesResponse](#prometheusrulesresponse), [PrometheusValue](#prometheusvalue), [ResolvedExtension](#resolvedextension), [Rule](#rule), [Selector](#selector), [Silence](#silence), [K8sKind](#k8skind) |
| Interface (0) |  |
| Enum (6) | [AlertSeverity](#alertseverity), [AlertStates](#alertstates), [Operator](#operator), [PrometheusEndpoint](#prometheusendpoint), [RuleStates](#rulestates), [SilenceStates](#silencestates) |

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `Alert`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `Alerts`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `AlertSeverity`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `AlertStates`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)

---

## `CamelCaseWrap`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/camel-case-wrap.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/camel-case-wrap.tsx)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `ColoredIconProps`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts)

---

## `DiscoveryResources`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `DocumentTitle`

### Summary 

A component to change the document title of the page.


### Example

```tsx
<DocumentTitle>My Page Title</DocumentTitle>
```
This will change the title to "My Page Title · [Product Name]"



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `children` | The title to display |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `ErrorBoundaryFallbackPage`

### Summary 

Creates a full page ErrorBoundaryFallbackPage component to display the "Something wrong happened" message along with the stack trace and other helpful debugging information.<br/>This is to be used in conjunction with an `ErrorBoundary` component.


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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)

---

## `ExtensionHook`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ExtensionHookResult`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ExtensionK8sGroupKindModel`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ExtensionK8sGroupModel`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ExtensionK8sKindVersionModel`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ExtensionK8sModel`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `GenericStatus`

### Summary 

Component for a generic status popover


### Example

```tsx
<GenericStatus Icon={CircleIcon} />
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `title` | (optional) status text |
| `iconOnly` | (optional) if true, only displays icon |
| `noTooltip` | (optional) if true, tooltip won't be displayed |
| `className` | (optional) additional class name for the component |
| `popoverTitle` | (optional) title for popover |
| `Icon` | icon to be displayed |
| `children` | (optional) children for the component |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/GenericStatus.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/GenericStatus.tsx)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-ref.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-ref.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-ref.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-ref.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-ref.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-ref.ts)

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
| `size` | (optional) icon size: ('sm', 'md', 'lg', 'xl', '2xl', '3xl', 'headingSm', 'headingMd', 'headingLg', 'headingXl', 'heading_2xl', 'heading_3xl', 'bodySm', 'bodyDefault', 'bodyLg') |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)

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
      component: ({customData}) => <>{customData.color} Home</>
    }
    return <HorizontalNav pages={[page]} customData={ color: 'Red'} />
}
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | (optional) the resource associated with this Navigation, an object of K8sResourceCommon type |
| `pages` | an array of page objects |
| `customData` | (optional) custom data to be shared between the pages in the navigation. |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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






### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `isAllNamespacesKey`

### Summary 

Returns true if the provided value represents the special "all" namespaces option key.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/utils.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/utils.ts)

---

## `k8sCreate`

### Summary 

It creates a resource in the cluster, based on the provided options.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map |
| `` | options.model - Kubernetes model |
| `` | options.data - payload for the resource to be created |
| `` | options.path - Appends as subpath if provided |
| `` | options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource created.<br/>In case of failure, the promise gets rejected with HTTP error response.


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts)

---

## `k8sDelete`

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
| `` | options.model - Kubernetes model |
| `` | options.resource - The resource to be deleted. |
| `` | options.path - Appends as subpath if provided. |
| `` | options.queryParams - The query parameters to be included in the URL. |
| `` | options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html |
| `` | options.json - Can control garbage collection of resources explicitly if provided else will default to model's `propagationPolicy`. |



### Returns

A promise that resolves to the response of kind Status.<br/>In case of failure promise gets rejected with HTTP error response.


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts)

---

## `k8sGet`

### Summary 

It fetches a resource from the cluster, based on the provided options.<br/>If the name is provided it returns resource, else it returns all the resources matching the model.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map |
| `` | options.model - Kubernetes model |
| `` | options.name - The name of the resource, if not provided then it looks for all the resources matching the model. |
| `` | options.ns - The namespace to look into, should not be specified for cluster-scoped resources. |
| `` | options.path - Appends as subpath if provided |
| `` | options.queryParams - The query parameters to be included in the URL. |
| `` | options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html |



### Returns

A promise that resolves to the response as JSON object with a resource if the name is provided, else it returns all the resources matching the model. In case of failure, the promise gets rejected with HTTP error response.


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts)

---

## `k8sList`

### Summary 

It lists the resources as an array in the cluster, based on the provided options.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map. |
| `` | options.model - Kubernetes model |
| `` | options.queryParams - The query parameters to be included in the URL. It can also pass label selectors by using the `labelSelector` key. |
| `` | options.requestInit - The fetch init object to use. This can have request headers, method, redirect, and so forth. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html |



### Returns

A promise that resolves to the response


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts)

---

## `k8sListItems`

### Summary 

Same interface as k8sListResource but returns the sub items.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts)

---

## `K8sModel`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `k8sPatch`

### Summary 

It patches any resource in the cluster, based on the provided options.<br/>When a client needs to perform the partial update, the client can use k8sPatch.<br/>Alternatively, the client can use k8sUpdate to replace an existing resource entirely.<br/>See more https://datatracker.ietf.org/doc/html/rfc6902




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as key-value pairs in the map. |
| `` | options.model - Kubernetes model |
| `` | options.resource - The resource to be patched. |
| `` | options.data - Only the data to be patched on existing resource with the operation, path, and value. |
| `` | options.path - Appends as subpath if provided. |
| `` | options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource patched.<br/>In case of failure promise gets rejected with HTTP error response.


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts)

---

## `k8sUpdate`

### Summary 

It updates the entire resource in the cluster, based on the provided options.<br/>When a client needs to replace an existing resource entirely, the client can use k8sUpdate.<br/>Alternatively, the client can use k8sPatch to perform the partial update.




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | which are passed as key-value pair in the map |
| `` | options.model - Kubernetes model |
| `` | options.data - payload for the Kubernetes resource to be updated |
| `` | options.ns - namespace to look into, it should not be specified for cluster-scoped resources. |
| `` | options.name - resource name to be updated. |
| `` | options.path - appends as subpath if provided. |
| `` | options.queryParams - The query parameters to be included in the URL. |



### Returns

A promise that resolves to the response of the resource updated.<br/>In case of failure promise gets rejected with HTTP error response.


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/k8s-resource.ts)

---

## `K8sVerb`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ListPageBody`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/factory/ListPage/ListPageBody.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/factory/ListPage/ListPageBody.tsx)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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
| `title` | The heading title. If no title is set, only the `children`, `badge`, and `helpAlert` props will be rendered. |
| `badge` | (optional) A badge that is displayed next to the title of the heading |
| `helpAlert` | (optional) An alert placed below the heading in the same PageSection. |
| `helpText` | (optional) A subtitle placed below the title. |
| `hideFavoriteButton` | (optional) The "Add to favourites" button is shown by default while in the admin perspective. This prop allows you to hide the button. It should be hidden when `ListPageHeader` is not the primary page header to avoid having multiple favourites buttons. |
| `children` | (optional) A primary action that is always rendered. |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `MatchExpression`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `MatchLabels`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ModalComponent`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/ModalProvider.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/ModalProvider.tsx)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `Operator`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `OverlayComponent`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/OverlayProvider.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/OverlayProvider.tsx)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `PerspectiveContextType`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/perspective/perspective-context.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/perspective/perspective-context.ts)

---

## `PopoverStatus`

### Summary 

Component for creating a status popover item


### Example

```tsx
<PopoverStatus title={title} statusBody={statusBody}>
  {children}
</PopoverStatus>
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `statusBody` | content displayed within the popover. |
| `onHide` | (optional) function invoked when popover begins to transition out |
| `onShow` | (optional) function invoked when popover begins to appear |
| `title` | (optional) title for the popover |
| `hideHeader` | (optional) when true, header text is hidden |
| `isVisible` | (optional) when true, the popover is displayed |
| `shouldClose` | (optional) callback function invoked when the popover is closed only if isVisible is also controlled |
| `children` | (optional) children for the component |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/PopoverStatus.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/PopoverStatus.tsx)

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
| `children` | (optional) children for the component |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)

---

## `PrometheusAlert`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `PrometheusEndpoint`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `PrometheusLabels`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `PrometheusRule`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `PrometheusRulesResponse`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `PrometheusValue`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)

---

## `ResolvedExtension`

### Summary 

Modify `TExtension` type by replacing `CodeRef<T>` property values with `T` values.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `ResourceStatus`

### Summary 

Component for displaying resource status badge.<br/>Use this component to display status of given resource.<br/>It accepts child element to be rendered inside the badge.<br/>@component ResourceStatus


### Example

```ts
return (
 <ResourceStatus>
   <Status status={resourceStatus} />
 </ResourceStatus>
)
```






### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/resource-status.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/resource-status.tsx)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `Rule`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `RuleStates`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `Selector`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `Silence`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `SilenceStates`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `StatusComponent`

### Summary 

Component for displaying a status message


### Example

```tsx
<Status status='Warning' />
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `status` | type of status to be displayed |
| `title` | (optional) status text |
| `iconOnly` | (optional) if true, only displays icon |
| `noTooltip` | (optional) if true, tooltip won't be displayed |
| `className` | (optional) additional class name for the component |
| `popoverTitle` | (optional) title for popover |
| `children` | (optional) children for the component |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/Status.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/Status.tsx)

---

## `StatusIconAndText`

### Summary 

Component for displaying a status icon and text


### Example

```tsx
<StatusIconAndText title={title} icon={renderIcon} />
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `title` | (optional) status text |
| `iconOnly` | (optional) if true, only displays icon |
| `noTooltip` | (optional) if true, tooltip won't be displayed |
| `className` | (optional) additional class name for the component |
| `icon` | (optional) icon to be displayed |
| `spin` | (optional) if true, icon rotates |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/StatusIconAndText.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/StatusIconAndText.tsx)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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
        <span className="pf-v6-u-text-color-subtle">
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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/statuses.tsx)

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
      <TableData id='' className='pf-v6-c-table__action' activeColumnIDs={activeColumnIDs}>
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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx)

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
  return userSettingsLoaded ? <VirtualizedTable columns={activeColumns} {...otherProps} /> : null
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Which are passed as a key-value in the map |
| `` | options.columns - An array of all available TableColumns |
| `` | options.showNamespaceOverride - (optional) If true, a namespace column will be included, regardless of column management selections |
| `` | options.columnManagementID - (optional) A unique id used to persist and retrieve column management selections to and from user settings. Usually a `group~version~kind` string for a resource. |



### Returns

A tuple containing the current user-selected active columns (a subset of options.columns), and a boolean flag indicating whether user settings have been loaded.


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/flags.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/flags.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModels.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModels.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResources.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResources.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useOverlay`

### Summary 

The `useOverlay` hook inserts a component directly to the DOM outside the web console's page structure. This allows the component to be freely styled and positioning with CSS. For example, to float the overlay in the top right corner of the UI: `style={{ position: 'absolute', right: '2rem', top: '2rem', zIndex: 999 }}`.<br/><br/>It is possible to add multiple overlays by calling `useOverlay` multiple times.<br/><br/>A `closeOverlay` function is passed to the overlay component. Calling it removes the component from the DOM without affecting any other overlays that might have been added with `useOverlay`.<br/><br/>Additional props can be passed to `useOverlay` and they will be passed through to the overlay component.


### Example

```tsx
const OverlayComponent = ({ closeOverlay, heading }) => {
  return (
    <div style={{ position: 'absolute', right: '2rem', top: '2rem', zIndex: 999 }}>
      <h2>{heading}</h2>
      <Button onClick={closeOverlay}>Close</Button>
    </div>
  );
};

const ModalComponent = ({ body, closeOverlay, title }) => (
  <Modal isOpen onClose={closeOverlay}>
    <ModalHeader title={title} />
    <ModalBody>{body}</ModalBody>
  </Modal>
);

const AppPage: React.FC = () => {
  const launchOverlay = useOverlay();
  const onClickOverlay = () => {
    launchOverlay(OverlayComponent, { heading: 'Test overlay' });
  };
  const onClickModal = () => {
    launchOverlay(ModalComponent, { body: 'Test modal', title: 'Overlay modal' });
  };
  return (
    <Button onClick={onClickOverlay}>Launch an Overlay</Button>
    <Button onClick={onClickModal}>Launch a Modal</Button>
  )
}
```






### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/useOverlay.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/useOverlay.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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
| `dataTest` | (optional) icon test id |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/icons.tsx)

---

## `K8sKind`

### Summary [DEPRECATED]

@deprecated migrated to new type K8sModel, use K8sModel over K8sKind







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `ListPageFilter`

### Summary [DEPRECATED]

@deprecated Use PatternFly's [Data view](https://www.patternfly.org/extensions/data-view/overview) instead.<br/>Component that generates filter for list page.


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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `PerspectiveContext`

### Summary [DEPRECATED]

@deprecated - use the provided `usePerspectiveContext` insteadCreates the perspective context




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `PerspectiveContextType` | object with active perspective and setter |



### Returns

React context


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/perspective/perspective-context.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/perspective/perspective-context.ts)

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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx)

---

## `useListPageFilter`

### Summary [DEPRECATED]

@deprecated Use PatternFly's [Data view](https://www.patternfly.org/extensions/data-view/overview) instead.<br/>A hook that manages filter state for the ListPageFilter component.


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


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useModal`

### Summary [DEPRECATED]

@deprecated - Use useOverlay from \@console/dynamic-plugin-sdk instead.<br/>A hook to launch Modals.<br/><br/>Additional props can be passed to `useModal` and they will be passed through to the modal component.<br/>An optional ID can also be passed to `useModal`. If provided, this distinguishes the modal from<br/>other modals to allow multiple modals to be displayed at the same time.


### Example

```tsx
const AppPage: React.FC = () => {
 const launchModal = useModal();
 const onClick1 = () => launchModal(ModalComponent);
 const onClick2 = () => launchModal(ModalComponent, { title: 'Test modal' }, 'TEST_MODAL_ID');
 return (
   <>
     <Button onClick={onClick1}>Launch basic modal</Button>
     <Button onClick={onClick2}>Launch modal with props and an ID</Button>
   </>
 )
}
```






### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/useModal.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/modal-support/useModal.ts)

---

## `VirtualizedTable`

### Summary [DEPRECATED]

@deprecated Use PatternFly's [Data view](https://www.patternfly.org/extensions/data-view/overview) instead.<br/>A component for making virtualized tables


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
| `onRowsRendered` | (optional) Callback invoked with information about the slice of rows that were just rendered. |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

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




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

