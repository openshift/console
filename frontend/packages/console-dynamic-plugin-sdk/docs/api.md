# OpenShift Console API

| API kind | Exposed APIs |
| -------- | ------------ |
| Variable (82) | [ActionServiceProvider](#actionserviceprovider), [BlueInfoCircleIcon](#blueinfocircleicon), [CamelCaseWrap](#camelcasewrap), [checkAccess](#checkaccess), [CodeEditor](#codeeditor), [consoleFetch](#consolefetch), [consoleFetchJSON](#consolefetchjson), [consoleFetchText](#consolefetchtext), [DocumentTitle](#documenttitle), [ErrorBoundaryFallbackPage](#errorboundaryfallbackpage), [ErrorStatus](#errorstatus), [GenericStatus](#genericstatus), [getAPIVersionForModel](#getapiversionformodel), [getGroupVersionKindForModel](#getgroupversionkindformodel), [getGroupVersionKindForResource](#getgroupversionkindforresource), [GreenCheckCircleIcon](#greencheckcircleicon), [HorizontalNav](#horizontalnav), [InfoStatus](#infostatus), [InventoryItem](#inventoryitem), [InventoryItemBody](#inventoryitembody), [InventoryItemLoading](#inventoryitemloading), [InventoryItemStatus](#inventoryitemstatus), [InventoryItemTitle](#inventoryitemtitle), [isAllNamespacesKey](#isallnamespaceskey), [k8sCreate](#k8screate), [k8sDelete](#k8sdelete), [k8sGet](#k8sget), [k8sList](#k8slist), [k8sListItems](#k8slistitems), [k8sPatch](#k8spatch), [k8sUpdate](#k8supdate), [ListPageBody](#listpagebody), [ListPageCreate](#listpagecreate), [ListPageCreateButton](#listpagecreatebutton), [ListPageCreateDropdown](#listpagecreatedropdown), [ListPageCreateLink](#listpagecreatelink), [ListPageHeader](#listpageheader), [NamespaceBar](#namespacebar), [Overview](#overview), [OverviewGrid](#overviewgrid), [PopoverStatus](#popoverstatus), [ProgressStatus](#progressstatus), [QueryBrowser](#querybrowser), [RedExclamationCircleIcon](#redexclamationcircleicon), [ResourceEventStream](#resourceeventstream), [ResourceIcon](#resourceicon), [ResourceLink](#resourcelink), [ResourceStatus](#resourcestatus), [ResourceYAMLEditor](#resourceyamleditor), [StatusComponent](#statuscomponent), [StatusIconAndText](#statusiconandtext), [StatusPopupItem](#statuspopupitem), [StatusPopupSection](#statuspopupsection), [SuccessStatus](#successstatus), [TableData](#tabledata), [Timestamp](#timestamp), [useAccessReview](#useaccessreview), [useActiveColumns](#useactivecolumns), [useActiveNamespace](#useactivenamespace), [useActivePerspective](#useactiveperspective), [useAnnotationsModal](#useannotationsmodal), [useDeleteModal](#usedeletemodal), [useFlag](#useflag), [useK8sModel](#usek8smodel), [useK8sModels](#usek8smodels), [useK8sWatchResource](#usek8swatchresource), [useK8sWatchResources](#usek8swatchresources), [useLabelsModal](#uselabelsmodal), [useOverlay](#useoverlay), [usePrometheusPoll](#useprometheuspoll), [useQuickStartContext](#usequickstartcontext), [useResolvedExtensions](#useresolvedextensions), [useUserSettings](#useusersettings), [YellowExclamationTriangleIcon](#yellowexclamationtriangleicon), [ListPageFilter](#listpagefilter), [PerspectiveContext](#perspectivecontext), [useAccessReviewAllowed](#useaccessreviewallowed), [useListPageFilter](#uselistpagefilter), [useModal](#usemodal), [useSafetyFirst](#usesafetyfirst), [VirtualizedTable](#virtualizedtable), [YAMLEditor](#yamleditor) |
| TypeAlias (28) | [Alert](#alert), [Alerts](#alerts), [AlwaysOnExtension](#alwaysonextension), [ColoredIconProps](#colorediconprops), [DiscoveryResources](#discoveryresources), [ExtensionHook](#extensionhook), [ExtensionHookResult](#extensionhookresult), [ExtensionK8sGroupKindModel](#extensionk8sgroupkindmodel), [ExtensionK8sGroupModel](#extensionk8sgroupmodel), [ExtensionK8sKindVersionModel](#extensionk8skindversionmodel), [ExtensionK8sModel](#extensionk8smodel), [K8sModel](#k8smodel), [K8sVerb](#k8sverb), [MatchExpression](#matchexpression), [MatchLabels](#matchlabels), [ModalComponent](#modalcomponent), [OverlayComponent](#overlaycomponent), [PerspectiveContextType](#perspectivecontexttype), [PrometheusAlert](#prometheusalert), [PrometheusLabels](#prometheuslabels), [PrometheusRule](#prometheusrule), [PrometheusRulesResponse](#prometheusrulesresponse), [PrometheusValue](#prometheusvalue), [ResolvedExtension](#resolvedextension), [Rule](#rule), [Selector](#selector), [Silence](#silence), [K8sKind](#k8skind) |
| Interface (1) | [ModelDefinition](#modeldefinition) |
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

## `AlwaysOnExtension`

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

Component that adds word break opportunities in camelCase and PascalCase strings for better text wrapping.<br/><br/>This utility component is essential for displaying Kubernetes resource names and identifiers<br/>that often use camelCase naming conventions. It prevents layout issues by allowing long<br/>names to wrap at appropriate word boundaries.<br/><br/>**Common use cases:**<br/>- Displaying resource names in tables and lists<br/>- Rendering property names in forms and detail views<br/>- Status text that might contain long concatenated words<br/>- Custom resource names and field identifiers<br/><br/>**Breaking algorithm:**<br/>- Splits text at capital letters that start new words<br/>- Preserves consecutive capital letters as single units (e.g., "XMLParser" → "XML", "Parser")<br/>- Inserts word break opportunities (`<wbr>`) between words<br/>- Handles mixed case and acronym patterns intelligently<br/><br/>**Performance optimizations:**<br/>- Results are memoized to avoid repeated processing<br/>- Efficient regex-based word boundary detection<br/>- Minimal DOM overhead with semantic HTML elements<br/>- Cache persists across component re-renders<br/><br/>**Edge cases:**<br/>- Empty or null values render as dash (-)<br/>- Single words without case changes remain unchanged<br/>- Numbers and special characters are preserved in place<br/>- Non-string values are handled gracefully


### Example

```tsx
// Basic camelCase wrapping
const ResourceName: React.FC<{name: string}> = ({name}) => {
  return (
    <div className="resource-name">
      <CamelCaseWrap value={name} dataTest="resource-name" />
    </div>
  );
};

// Examples of text transformation:
// "containerImagePullBackOff" → "container<wbr>Image<wbr>Pull<wbr>Back<wbr>Off"
// "XMLHttpRequest" → "XML<wbr>Http<wbr>Request"
// "simpleString" → "simple<wbr>String"
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `value` | The string to process for word breaking. Should be a camelCase, PascalCase, or mixed-case string |
| `dataTest` | Optional test identifier attribute for automated testing and debugging |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/camel-case-wrap.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/camel-case-wrap.tsx)

---

## `checkAccess`

### Summary 

Performs a Kubernetes access review to determine if the current user has permission for a specific resource operation.<br/><br/>**Note:** For React components, use the `useAccessReview` hook instead of calling this function directly.<br/>This function is primarily intended for non-React contexts and programmatic permission checks.<br/><br/>**Common use cases:**<br/>- Permission checks in utility functions and services<br/>- Conditional logic outside of React components<br/>- One-time permission validation in event handlers<br/>- Server-side or non-React permission checks<br/><br/>**Access review process:**<br/>- Creates SelfSubjectAccessReview API request<br/>- Handles impersonation context automatically<br/>- Returns cached results for identical requests<br/>- Follows Kubernetes RBAC evaluation rules


### Example

```tsx
// Non-React permission check
const validateUserAction = async (namespace: string) => {
  const result = await checkAccess({
    group: '',
    resource: 'pods',
    verb: 'create',
    namespace
  });
  return result.status.allowed;
};

// For React components, use useAccessReview instead:
const MyComponent: React.FC = () => {
  const [canCreate] = useAccessReview({
    group: '',
    resource: 'pods',
    verb: 'create',
    namespace: 'default'
  });

  return canCreate ? <CreateButton /> : null;
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resourceAttributes` | Object containing resource details for the access review |
| `impersonate` | Optional impersonation context for the permission check |



### Returns

Promise resolving to SelfSubjectAccessReview response containing permission status


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

A custom wrapper around `fetch` that adds Console-specific headers and provides timeout functionality.<br/><br/>This is the base fetch function used throughout the Console for all HTTP requests.<br/>It provides consistent behavior for authentication, CSRF protection, and error handling.<br/><br/>**Common use cases:**<br/>- Making API requests to Kubernetes API server through Console proxy<br/>- Fetching data from Console backend services<br/>- Custom plugin API requests that need Console authentication<br/><br/>**Features provided:**<br/>- Automatic timeout handling with configurable duration<br/>- Console-specific headers (CSRF, impersonation, etc.)<br/>- Integration with Console's authentication system<br/>- Error handling for common HTTP status codes<br/><br/>**Timeout behavior:**<br/>- Default timeout of 60 seconds for all requests<br/>- Set timeout to 0 or negative value to disable timeout<br/>- Throws TimeoutError when timeout is exceeded<br/>- Uses Promise.race to implement timeout functionality<br/><br/>**Edge cases:**<br/>- Timeout of 0 or negative disables timeout completely<br/>- May throw TimeoutError for slow network conditions<br/>- Response validation is handled by higher-level wrapper functions


### Example

```tsx
// Basic fetch with default timeout
const response = await consoleFetch('/api/kubernetes/api/v1/pods');
const pods = await response.json();
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch, can be relative or absolute |
| `options` | Standard fetch options (method, headers, body, etc.) |
| `timeout` | Timeout duration in milliseconds (default: 60000). Set to 0 to disable timeout |



### Returns

Promise that resolves to the Response object or rejects with TimeoutError


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts)

---

## `consoleFetchJSON`

### Summary 

A wrapper around `consoleFetch` that automatically parses JSON responses and handles Console-specific behavior.<br/><br/>This is the preferred method for making JSON API requests in Console plugins.<br/>It automatically handles JSON parsing, error responses, and Console-specific features.<br/><br/>**Common use cases:**<br/>- API requests to Kubernetes API server<br/>- Fetching configuration data from Console backend<br/>- CRUD operations on Kubernetes resources<br/>- Plugin API calls that expect JSON responses<br/><br/>**Response handling:**<br/>- Automatically sets Accept: application/json header<br/>- Parses JSON responses automatically<br/>- Handles empty responses gracefully<br/>- Processes warning headers for admission webhook feedback<br/><br/>**Error behavior:**<br/>- Throws errors for HTTP error status codes<br/>- Preserves original error information<br/>- Handles network timeouts appropriately<br/>- Logs admission webhook warnings to Redux store<br/><br/>**Content type handling:**<br/>- JSON responses are automatically parsed<br/>- Plain text responses are returned as strings<br/>- Empty responses return empty object or string based on content type


### Example

```tsx
// GET request for resource list
const pods = await consoleFetchJSON('/api/kubernetes/api/v1/namespaces/default/pods');
console.log('Pod count:', pods.items.length);
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch, typically a Kubernetes API endpoint |
| `method` | HTTP method to use (GET, POST, PUT, PATCH, DELETE). Defaults to GET |
| `options` | Additional fetch options (headers, body, etc.) |
| `timeout` | Timeout in milliseconds (default: 60000) |



### Returns

Promise that resolves to parsed JSON response or string for plain text


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/fetch/console-fetch.ts)

---

## `consoleFetchText`

### Summary 

A wrapper around `consoleFetch` specifically for text responses.<br/><br/>This function is optimized for fetching plain text content such as logs,<br/>configuration files, or other non-JSON resources.<br/><br/>**Common use cases:**<br/>- Fetching container logs from Kubernetes API<br/>- Downloading configuration files or manifests as text<br/>- Retrieving plain text API responses<br/>- Accessing raw content that shouldn't be JSON parsed<br/><br/>**Response handling:**<br/>- Always returns response as plain text<br/>- Preserves original text formatting and encoding<br/>- Handles empty responses appropriately<br/>- No automatic JSON parsing unlike consoleFetchJSON<br/><br/>**Use cases over consoleFetchJSON:**<br/>- When you specifically need text content<br/>- For responses that might not be valid JSON<br/>- When dealing with large text files or logs<br/>- For endpoints that return mixed content types


### Example

```tsx
// Fetch container logs
const logs = await consoleFetchText(
  '/api/kubernetes/api/v1/namespaces/default/pods/my-pod/log?container=app'
);
console.log(logs);  // Raw log text
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `url` | The URL to fetch text content from |
| `options` | Additional fetch options (headers, etc.) |
| `timeout` | Timeout in milliseconds (default: 60000) |



### Returns

Promise that resolves to the response as plain text


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

Component for displaying a generic status with customizable icon and optional popover content.<br/><br/>This is a foundational component for building status displays throughout the Console.<br/>It provides a flexible way to show status information with consistent styling and<br/>behavior patterns, including tooltips and popover content.<br/><br/>**Common use cases:**<br/>- Custom status indicators for application-specific states<br/>- Building status components for custom resources<br/>- Status displays with additional context in popovers<br/>- Reusable status patterns across different plugin interfaces<br/><br/>**Visual behavior:**<br/>- Shows icon with optional text label<br/>- Provides tooltip on hover (unless disabled)<br/>- Opens popover with additional content when children provided<br/>- Supports icon-only mode for compact displays<br/><br/>**Popover integration:**<br/>- When children are provided, component becomes clickable<br/>- Popover displays additional status details or actions<br/>- Popover title can be customized or defaults to main title<br/>- Consistent popover styling throughout Console<br/><br/>**Accessibility features:**<br/>- Proper ARIA labels and descriptions<br/>- Keyboard navigation support for popover triggers<br/>- Screen reader friendly status announcements<br/>- Focus management for popover interactions<br/><br/>**Edge cases:**<br/>- Gracefully handles missing or invalid icons<br/>- Empty children array doesn't trigger popover mode<br/>- Works with both functional and class components as icons<br/>- Handles dynamic title and children updates


### Example

```tsx
// Basic status with icon and text
const CustomStatus: React.FC<{state: string}> = ({state}) => {
  return (
    <GenericStatus
      Icon={CheckCircleIcon}
      title={`Application ${state}`}
      className="custom-status"
    />
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `Icon` | React component type that renders the status icon. Should accept optional title prop for accessibility |
| `title` | Optional status text displayed next to icon and used for tooltip content |
| `iconOnly` | Optional boolean to show only the icon without text label (default: false) |
| `noTooltip` | Optional boolean to disable tooltip display (default: false) |
| `className` | Optional additional CSS class name for custom styling |
| `popoverTitle` | Optional title for the popover header, defaults to main title if not provided |
| `children` | Optional React elements to display in popover. When provided, component becomes clickable and shows popover on interaction |




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

A component that creates a Navigation bar for a page with automatic routing and extension support.<br/><br/>This component provides a standard tabbed navigation pattern used throughout the OpenShift Console.<br/>It automatically handles routing between tabs and integrates with the plugin extension system.<br/><br/>**Common use cases:**<br/>- Resource detail pages (Pod details, Deployment details, etc.)<br/>- Multi-step workflows with distinct pages<br/>- Plugin pages that need consistent navigation patterns<br/><br/>**Extension integration:**<br/>- Other plugins can contribute tabs via `console.tab/horizontalNav` extensions<br/>- Extensions are automatically resolved and integrated into the navigation<br/>- Custom data is passed to all tab components for context sharing<br/><br/>**Routing behavior:**<br/>- URL fragments automatically sync with active tab<br/>- Navigation preserves query parameters and namespace context<br/>- Supports nested routing within individual tabs<br/><br/>**Edge cases:**<br/>- If no pages are provided, renders empty navigation<br/>- Invalid hrefs in pages array may cause routing issues<br/>- Resource prop should match the type expected by tab components


### Example

```tsx
// Basic resource detail navigation
const PodDetailsPage: React.FC<{pod: PodKind}> = ({pod}) => {
  const pages = [
    {
      href: '',
      name: 'Details',
      component: PodDetails
    },
    {
      href: 'yaml',
      name: 'YAML',
      component: PodYAML
    },
    {
      href: 'logs',
      name: 'Logs',
      component: PodLogs
    }
  ];

  return (
    <HorizontalNav
      resource={pod}
      pages={pages}
      customData={{theme: 'dark', showAdvanced: true}}
    />
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | Optional K8sResourceCommon object representing the resource being viewed. Passed to all tab components as props. Should match the expected type for the page components. |
| `pages` | Array of page configuration objects. Each page must have `href` (URL fragment), `name` (display text), and `component` (React component to render) |
| `customData` | Optional object containing custom data passed to all tab components. Useful for sharing configuration, theme settings, or computed values between tabs |




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

Container component that provides the main body layout for list pages.<br/><br/>This component wraps the main content area of list pages with consistent styling<br/>and layout patterns used throughout the Console. It provides proper spacing,<br/>responsive behavior, and integration with the Console's page layout system.<br/><br/>**Common use cases:**<br/>- Wrapping table components in resource list pages<br/>- Container for filtered list views with toolbars<br/>- Main content area for custom list implementations<br/><br/>**Layout behavior:**<br/>- Provides consistent padding and spacing for list content<br/>- Integrates with Console's responsive grid system<br/>- Handles overflow and scrolling for large lists<br/>- Maintains proper focus management for accessibility<br/><br/>**Styling integration:**<br/>- Uses PatternFly design tokens for consistent theming<br/>- Inherits Console's standard page layout patterns<br/>- Supports both light and dark theme modes<br/>- Responsive design adapts to different screen sizes<br/><br/>**Edge cases:**<br/>- Handles empty content gracefully<br/>- Works with dynamic content that changes size<br/>- Supports nested scrollable areas when needed


### Example

```tsx
// Basic list page structure
const PodListPage: React.FC = () => {
  const [pods, loaded, error] = useK8sWatchResource({
    kind: 'Pod',
    isList: true
  });

  return (
    <>
      <ListPageHeader title="Pods" />
      <ListPageBody>
        <VirtualizedTable
          data={pods}
          loaded={loaded}
          loadError={error}
          columns={podColumns}
          Row={PodRow}
        />
      </ListPageBody>
    </>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `children` | React elements to render within the list page body container. Typically includes tables, filters, pagination, and other list-related components |




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

Component for creating a stylized link with built-in access control validation.<br/><br/>This component provides a consistent way to create navigation links that automatically<br/>check user permissions before rendering, ensuring users only see links they can actually use.<br/><br/>**Common use cases:**<br/>- Create buttons that navigate to resource creation forms<br/>- Action links in list page headers<br/>- Navigation links that require specific permissions<br/><br/>**Access control:**<br/>- Automatically validates user permissions using provided access review<br/>- Hides or disables link if user lacks required permissions<br/>- Supports both resource-level and namespace-level access checks<br/><br/>**Styling:**<br/>- Applies consistent Console link styling<br/>- Integrates with PatternFly button and link components<br/>- Supports various visual states (normal, disabled, loading)<br/><br/>**Edge cases:**<br/>- If no access review provided, link is always visible<br/>- Invalid 'to' prop may cause navigation issues<br/>- Access review failures result in hidden/disabled link


### Example

```tsx
// Basic create link with access control
const CreatePodLink: React.FC<{namespace: string}> = ({namespace}) => {
  return (
    <ListPageCreateLink
      to={`/k8s/ns/${namespace}/pods/~new`}
      createAccessReview={{
        group: '',
        resource: 'pods',
        verb: 'create',
        namespace
      }}
    >
      Create Pod
    </ListPageCreateLink>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `to` | String URL path where the link should navigate. Can be relative or absolute path |
| `createAccessReview` | Optional access review object specifying the permissions required to show this link. Contains group, resource, verb, and optionally namespace |
| `children` | Optional React children to render inside the link component |




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

## `ModelDefinition`

### Summary 

Documentation is not available, please refer to the implementation.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/common-types.ts)

---

## `NamespaceBar`

### Summary 

A component that renders a horizontal toolbar with a namespace dropdown menu for namespace-aware pages.<br/><br/>This component provides the standard namespace selection interface used throughout the Console<br/>on pages that need to operate within a specific namespace context.<br/><br/>**Common use cases:**<br/>- Resource list pages that filter by namespace<br/>- Dashboard pages showing namespace-specific metrics<br/>- Forms that create resources in a selected namespace<br/><br/>**Layout behavior:**<br/>- Namespace dropdown is positioned on the left side<br/>- Additional toolbar components render to the right<br/>- Maintains consistent spacing and alignment<br/>- Integrates with Console's standard page layout<br/><br/>**Namespace management:**<br/>- Automatically syncs with global namespace context<br/>- Updates URL parameters when namespace changes<br/>- Preserves other URL state during namespace switches<br/>- Handles permissions and namespace access validation<br/><br/>**Dropdown options:**<br/>- Shows all accessible namespaces for the current user<br/>- Includes "All Namespaces" option for cluster-wide views<br/>- Filters namespaces based on RBAC permissions<br/>- Sorts namespaces alphabetically for easy navigation<br/><br/>**Edge cases:**<br/>- Disabled state prevents namespace changes<br/>- Invalid namespaces are filtered from dropdown<br/>- Network errors may temporarily disable dropdown<br/>- Some pages may not support "All Namespaces" view


### Example

```tsx
// Basic namespace bar for resource listing page
const ResourceListPage: React.FC = () => {
  const handleNamespaceChange = (newNamespace: string) => {
    // Additional logic when namespace changes
    console.log(`Switched to namespace: ${newNamespace}`);
    // Clear any search/filter state that's namespace-specific
    setSearchTerm('');
  };

  return (
    <>
      <NamespaceBar onNamespaceChange={handleNamespaceChange}>
        <Button variant="primary">Create Resource</Button>
        <RefreshButton />
      </NamespaceBar>
      <PageBody>
        <ResourceTable />
      </PageBody>
    </>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `onNamespaceChange` | Optional callback function executed when namespace selection changes. Receives the new namespace string as argument. Useful for clearing filters or triggering data refreshes |
| `isDisabled` | Optional boolean to disable the namespace dropdown while keeping the toolbar layout. Child components remain functional |
| `children` | Optional React elements to render in the toolbar to the right of the namespace dropdown. Common elements include buttons, selectors, and breadcrumbs |




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

Component for creating interactive status displays with popover content.<br/><br/>This component wraps status indicators to make them clickable and display additional<br/>information in a popover. It's commonly used throughout the Console to provide detailed<br/>status information without cluttering the main interface.<br/><br/>**Common use cases:**<br/>- Detailed error messages for failed resources<br/>- Additional metrics and information for status indicators<br/>- Rich content displays for complex status states<br/>- Action buttons and links related to specific statuses<br/><br/>**Interaction behavior:**<br/>- Status element becomes clickable button trigger<br/>- Popover appears on click with detailed content<br/>- Supports both controlled and uncontrolled popover visibility<br/>- Proper keyboard navigation and focus management<br/><br/>**Layout features:**<br/>- Configurable popover positioning (defaults to right)<br/>- Optional header with title display<br/>- Responsive design adapts to screen size<br/>- Consistent styling with Console design system<br/><br/>**Accessibility:**<br/>- Proper ARIA labels and descriptions<br/>- Keyboard navigation support<br/>- Screen reader compatible status announcements<br/>- Focus management for popover interactions<br/><br/>**Edge cases:**<br/>- Handles empty or missing content gracefully<br/>- Works with dynamic content that changes size<br/>- Supports controlled visibility for programmatic control<br/>- Manages multiple popover instances appropriately


### Example

```tsx
// Error status with detailed error information
const ErrorStatusWithDetails: React.FC<{error: Error}> = ({error}) => {
  const statusBody = (
    <StatusIconAndText
      icon={<ExclamationCircleIcon />}
      title="Error"
      className="status-error"
    />
  );

  return (
    <PopoverStatus
      title="Error Details"
      statusBody={statusBody}
    >
      <div>
        <p><strong>Error:</strong> {error.message}</p>
        <p><strong>Code:</strong> {error.code}</p>
        <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
        <Button variant="link" onClick={() => retryAction()}>
          Retry Operation
        </Button>
      </div>
    </PopoverStatus>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `statusBody` | React element that serves as the clickable trigger for the popover. Usually a status component with icon and text |
| `title` | Optional title text displayed in the popover header. Also used for accessibility labels |
| `hideHeader` | Optional boolean to hide the popover header completely (default: false) |
| `isVisible` | Optional boolean for controlled popover visibility. When provided, component operates in controlled mode |
| `shouldClose` | Optional callback function for controlled mode, invoked when popover should close |
| `shouldOpen` | Optional callback function that determines if popover should open on trigger interaction |
| `onShow` | Optional callback invoked when popover begins to appear, useful for analytics or state management |
| `onHide` | Optional callback invoked when popover begins to hide, useful for cleanup or state management |
| `children` | React elements to display in the popover body. Can include any content: text, buttons, forms, charts, etc. |




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

Update `CodeRef` properties of extension `E` to the referenced object types.<br/><br/>This also coerces `E` type to `LoadedExtension` interface for runtime consumption.







### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/types.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/types.ts)

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

Component that creates an icon badge for a specific resource type.<br/><br/>This component provides visual identification for Kubernetes resource types throughout<br/>the Console interface, helping users quickly identify different kinds of resources.<br/><br/>**Common use cases:**<br/>- Table columns showing resource type icons<br/>- Legend components for multi-resource views<br/>- Resource type indicators in forms and selectors<br/><br/>**Icon system:**<br/>- Uses Console's built-in icon mapping for standard Kubernetes resources<br/>- Falls back to generic icons for unknown or custom resource types<br/>- Supports both legacy kind strings and modern groupVersionKind objects<br/>- Icons are SVG-based and scale appropriately<br/><br/>**Visual consistency:**<br/>- Maintains consistent sizing and spacing<br/>- Integrates with PatternFly design system<br/>- Supports custom CSS classes for styling overrides<br/><br/>**Edge cases:**<br/>- Unknown resource kinds display a generic resource icon<br/>- Missing kind parameter shows a default placeholder icon<br/>- Custom resources may not have specific icons


### Example

```tsx
// Basic resource icon
const ResourceTypeIndicator: React.FC<{resourceKind: string}> = ({resourceKind}) => {
  return (
    <div className="resource-type-indicator">
      <ResourceIcon kind={resourceKind} />
      <span>{resourceKind}</span>
    </div>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `kind` | Optional legacy resource kind reference string (deprecated, use groupVersionKind instead) |
| `groupVersionKind` | Optional object with group, version, and kind properties for the resource type |
| `className` | Optional CSS class name to apply to the icon component |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `ResourceLink`

### Summary 

Component that creates a link to a specific resource type with an icon badge.<br/><br/>This is one of the most commonly used components in the Console, providing a consistent<br/>way to display and link to Kubernetes resources throughout the interface.<br/><br/>**Common use cases:**<br/>- Displaying resource references in tables and detail views<br/>- Creating navigation between related resources<br/>- Showing resource relationships and dependencies<br/><br/>**Visual appearance:**<br/>- Automatically displays appropriate icon for the resource type<br/>- Shows resource name as clickable link (when linkTo=true)<br/>- Supports custom display names and truncation for long names<br/>- Integrates with Console's resource icon system<br/><br/>**Navigation behavior:**<br/>- Links to standard resource detail pages by default<br/>- Respects current namespace context for namespaced resources<br/>- Handles both cluster-scoped and namespaced resources<br/>- Supports custom click handlers for non-standard navigation<br/><br/>**Edge cases:**<br/>- Missing resource names display as "(none)" or similar placeholder<br/>- Invalid resource kinds may show generic icons<br/>- Cluster-scoped resources ignore namespace parameter<br/>- Non-existent resources still render links (404 handled by target page)


### Example

```tsx
// Basic resource link
const PodReference: React.FC<{pod: PodKind}> = ({pod}) => {
  return (
    <ResourceLink
      kind="Pod"
      name={pod.metadata.name}
      namespace={pod.metadata.namespace}
      title={pod.metadata.uid}
    />
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `kind` | Optional legacy resource kind reference string (deprecated, use groupVersionKind instead) |
| `groupVersionKind` | Optional object with group, version, and kind properties for the resource type |
| `className` | Optional CSS class name to apply to the component |
| `displayName` | Optional custom display name that overrides the resource name |
| `inline` | Optional boolean to render icon and name inline with children (default: false) |
| `linkTo` | Optional boolean to create a navigable link (default: true) |
| `name` | Optional name of the resource instance |
| `namespace` | Optional namespace for namespaced resources |
| `hideIcon` | Optional boolean to hide the resource type icon (default: false) |
| `title` | Optional title attribute for the link element (not visually displayed) |
| `dataTest` | Optional test identifier for automated testing |
| `onClick` | Optional click handler function, overrides default navigation when provided |
| `truncate` | Optional boolean to truncate long resource names (default: false) |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `ResourceStatus`

### Summary 

Component that wraps status indicators with a styled badge container for consistent resource status displays.<br/><br/>This component provides a standardized visual container for resource status information<br/>throughout the Console. It creates a consistent badge appearance with proper spacing<br/>and styling that integrates with the overall design system.<br/><br/>**Common use cases:**<br/>- Wrapping status components in resource tables<br/>- Displaying resource health indicators in lists<br/>- Creating consistent status badges in cards and detail views<br/>- Standardizing status appearance across different contexts<br/><br/>**Visual appearance:**<br/>- Creates a rounded badge container with consistent styling<br/>- Provides proper padding and spacing for status content<br/>- Integrates with PatternFly design system colors and typography<br/>- Supports both standard and alternative styling variants<br/><br/>**Layout behavior:**<br/>- Maintains consistent badge sizing across different status types<br/>- Provides proper alignment within parent containers<br/>- Handles text overflow and wrapping appropriately<br/>- Responsive design adapts to container constraints<br/><br/>**Accessibility features:**<br/>- Includes data-test attributes for automated testing<br/>- Maintains semantic HTML structure<br/>- Preserves screen reader compatibility of child content<br/>- Supports keyboard navigation patterns<br/><br/>**Edge cases:**<br/>- Handles empty or missing child content gracefully<br/>- Works with various status component types<br/>- Supports dynamic content updates<br/>- Maintains visual consistency with different badge variants


### Example

```tsx
// Basic resource status badge
const PodStatusBadge: React.FC<{pod: PodKind}> = ({pod}) => {
  return (
    <ResourceStatus>
      <Status status={pod.status?.phase || 'Unknown'} />
    </ResourceStatus>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `children` | React elements to render inside the badge container. Typically status components like Status, GenericStatus, or StatusIconAndText |
| `additionalClassNames` | Optional additional CSS class names for custom styling and theming |
| `badgeAlt` | Optional boolean to use alternative badge styling variant for different visual contexts |




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

Component for displaying standardized status indicators with predefined styles and icons.<br/><br/>This component provides a comprehensive set of predefined status types commonly used<br/>throughout Kubernetes and OpenShift environments. It automatically maps status strings<br/>to appropriate icons and colors, ensuring consistent status representation across the Console.<br/><br/>**Common use cases:**<br/>- Displaying Pod phase status (Running, Pending, Failed, etc.)<br/>- Showing deployment rollout status (Progressing, Complete, Failed)<br/>- Resource health indicators (Ready, Not Ready, Warning)<br/>- Installation and upgrade status displays<br/><br/>**Status categories:**<br/>- **Progress states**: New, Pending, Installing, Updating, In Progress<br/>- **Success states**: Complete, Ready, Active, Bound, Succeeded<br/>- **Warning states**: Warning, RequiresApproval<br/>- **Error states**: Failed, Error, CrashLoopBackOff, ImagePullBackOff<br/>- **Cancelled states**: Cancelled, Deleting, Terminating, Superseded<br/><br/>**Icon mapping:**<br/>- Each status type has a predefined icon for visual consistency<br/>- Colors follow PatternFly design system conventions<br/>- Icons are semantically meaningful and accessible<br/>- Fallback behavior for unknown status values<br/><br/>**Extensibility:**<br/>- Supports children content for additional status details<br/>- Can be used with popover content for more information<br/>- Allows custom styling through className prop<br/>- Works with existing tooltip and accessibility systems<br/><br/>**Edge cases:**<br/>- Unknown status values render as plain text or dash<br/>- Empty/null status values display as dash (—)<br/>- Children content triggers enhanced status display modes<br/>- Handles case-sensitive status matching


### Example

```tsx
// Basic pod status display
const PodStatusBadge: React.FC<{pod: PodKind}> = ({pod}) => {
  const phase = pod.status?.phase || 'Unknown';

  return (
    <Status
      status={phase}
      title={`Pod is ${phase.toLowerCase()}`}
      className="pod-status"
    />
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `status` | The status string that determines which icon and color to display. Common values include: 'Running', 'Pending', 'Failed', 'Complete', 'Warning', 'Error', etc. |
| `title` | Optional custom text to display next to the icon. If not provided, defaults to the status value |
| `iconOnly` | Optional boolean to show only the icon without text label (default: false) |
| `noTooltip` | Optional boolean to disable tooltip display (default: false) |
| `className` | Optional additional CSS class name for custom styling |
| `children` | Optional React elements to display in enhanced status mode, typically used for detailed status information or error messages |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/Status.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/status/Status.tsx)

---

## `StatusIconAndText`

### Summary 

Foundational component for displaying status information with icon and text combinations.<br/><br/>This is a low-level building block used throughout the Console status system to create<br/>consistent visual representations of status information. It handles the layout, spacing,<br/>and interaction between icons and text labels.<br/><br/>**Common use cases:**<br/>- Building blocks for higher-level status components<br/>- Custom status indicators with specific icons<br/>- Status displays in tables and lists<br/>- Progress indicators with spinning animations<br/><br/>**Layout behavior:**<br/>- Icon and text are properly aligned and spaced<br/>- Responsive design adapts to different container sizes<br/>- Consistent styling follows Console design patterns<br/>- Supports both horizontal and compact layouts<br/><br/>**Icon features:**<br/>- Optional spinning animation for progress states<br/>- Automatic icon sizing and color inheritance<br/>- Proper alignment with text content<br/>- Supports both PatternFly and custom icons<br/><br/>**Text handling:**<br/>- Automatic camelCase to space formatting<br/>- Tooltip support for icon-only displays<br/>- Fallback to dash (—) for empty content<br/>- Proper text wrapping and truncation<br/><br/>**Accessibility:**<br/>- Proper ARIA labels and descriptions<br/>- Tooltip text for icon-only displays<br/>- Screen reader compatible content<br/>- Keyboard navigation support<br/><br/>**Edge cases:**<br/>- Missing title renders as dash placeholder<br/>- Icon-only mode provides tooltip with title<br/>- Handles dynamic icon and title updates<br/>- Works with various icon component types


### Example

```tsx
// Basic status with icon and text
const BasicStatus: React.FC<{isReady: boolean}> = ({isReady}) => {
  return (
    <StatusIconAndText
      icon={isReady ? <CheckCircleIcon /> : <ExclamationTriangleIcon />}
      title={isReady ? "Ready" : "Not Ready"}
      className="resource-status"
    />
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `icon` | Optional React element to display as the status icon. Can be any PatternFly icon or custom component |
| `title` | Optional status text to display. If empty, component renders as dash (—). Text is automatically formatted from camelCase |
| `iconOnly` | Optional boolean to show only the icon without text label (default: false) |
| `noTooltip` | Optional boolean to disable tooltip display for icon-only mode (default: false) |
| `spin` | Optional boolean to add rotating animation to the icon, useful for progress states (default: false) |
| `className` | Optional additional CSS class name for custom styling |




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

A component to render timestamp with consistent formatting and user locale support.<br/><br/>This component provides a standardized way to display timestamps throughout the Console<br/>with automatic formatting, tooltips, and relative time updates.<br/><br/>**Common use cases:**<br/>- Displaying resource creation and modification times<br/>- Showing event timestamps in chronological views<br/>- Formatting dates in tables and detail views<br/><br/>**Formatting behavior:**<br/>- Automatically formats according to user's browser locale<br/>- Shows relative time ("2 minutes ago") with absolute time in tooltip<br/>- Updates relative times automatically as time passes<br/>- Handles various input formats gracefully<br/><br/>**Synchronization:**<br/>- All timestamp instances update simultaneously for consistency<br/>- Uses shared timer to minimize performance impact<br/>- Maintains accurate relative times across the application<br/><br/>**Input format support:**<br/>- ISO 8601 strings (standard Kubernetes format)<br/>- Unix epoch timestamps (numbers)<br/>- JavaScript Date objects<br/>- RFC 3339 formatted strings<br/><br/>**Edge cases:**<br/>- Invalid timestamps display as "Unknown"<br/>- Future timestamps show as "in X time"<br/>- Very old timestamps may show absolute dates instead of relative<br/>- null/undefined timestamps render nothing


### Example

```tsx
// Basic timestamp for resource creation time
const ResourceAge: React.FC<{resource: K8sResourceKind}> = ({resource}) => {
  return (
    <div>
      <span>Created: </span>
      <Timestamp timestamp={resource.metadata.creationTimestamp} />
    </div>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `timestamp` | The timestamp to render. Accepts ISO 8601 strings (Kubernetes standard), Unix epoch numbers, or Date objects |
| `simple` | Optional boolean to render simple version without icon and tooltip (default: false) |
| `omitSuffix` | Optional boolean to format date without "ago" suffix for relative times (default: false) |
| `className` | Optional additional CSS class name for styling the component |




### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useAccessReview`

### Summary 

React hook that provides user permission status for specific Kubernetes resource operations.<br/><br/>This is the recommended way to check user permissions in React components. It handles<br/>loading states, caching, and error conditions automatically while providing a clean<br/>React-friendly API.<br/><br/>**Common use cases:**<br/>- Conditionally rendering create/edit/delete buttons<br/>- Showing/hiding menu items based on permissions<br/>- Disabling form fields for read-only users<br/>- Implementing fine-grained access control in UIs<br/><br/>**Hook behavior:**<br/>- Starts with loading=true, isAllowed=false<br/>- Performs async access review on mount and when dependencies change<br/>- Updates state when permission check completes<br/>- Defaults to allowing access if permission check fails (fail-open)<br/><br/>**Error handling:**<br/>- Network failures default to allowing access (server enforces final permissions)<br/>- Logs errors to console for debugging<br/>- Never blocks UI indefinitely due to permission check failures<br/>- Graceful degradation ensures functional UI even with RBAC issues<br/><br/>**Performance considerations:**<br/>- Results are cached to avoid redundant API calls<br/>- Prevents state updates on unmounted components<br/>- Efficiently handles dependency changes without excessive re-renders


### Example

```tsx
// Basic permission-based rendering
const CreatePodButton: React.FC<{namespace: string}> = ({namespace}) => {
  const [canCreate, loading] = useAccessReview({
    group: '',
    resource: 'pods',
    verb: 'create',
    namespace
  });

  if (loading) {
    return <Spinner size="sm" />;
  }

  return canCreate ? (
    <Button variant="primary">Create Pod</Button>
  ) : (
    <Tooltip content="You don't have permission to create pods">
      <Button variant="primary" isDisabled>Create Pod</Button>
    </Tooltip>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resourceAttributes` | Object containing resource details for the access review |
| `impersonate` | Optional impersonation context for the permission check |
| `noCheckForEmptyGroupAndResource` | Optional flag to skip check when group and resource are empty |



### Returns

Tuple containing [isAllowed: boolean, loading: boolean] - isAllowed indicates if user has permission, loading indicates if check is in progress


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/utils/rbac.tsx)

---

## `useActiveColumns`

### Summary 

A hook that provides a list of user-selected active TableColumns with persistent column management.<br/><br/>This hook integrates with the Console's column management system, allowing users to show/hide<br/>table columns with their preferences saved across sessions.<br/><br/>**Common use cases:**<br/>- Resource list tables that need customizable column visibility<br/>- Complex tables with many optional columns<br/>- Tables that need namespace column conditional visibility<br/><br/>**Persistence behavior:**<br/>- Column selections are saved to user settings (ConfigMap or localStorage)<br/>- Settings persist across browser sessions and page reloads<br/>- Each table can have independent column management via columnManagementID<br/><br/>**Column management integration:**<br/>- Works with the standard "Manage Columns" modal in table headers<br/>- Supports default column visibility via the `additional` property<br/>- Automatically handles system columns that can't be hidden<br/><br/>**Namespace column logic:**<br/>- Automatically hides namespace column when viewing single namespace<br/>- Shows namespace column when viewing "All Namespaces"<br/>- `showNamespaceOverride` can force namespace column visibility<br/><br/>**Edge cases:**<br/>- Returns all non-additional columns if no user settings exist<br/>- Filters out invalid column IDs from saved settings<br/>- Handles missing columnManagementID gracefully<br/>- Always includes columns with empty title (system columns)


### Example

```tsx
// Basic table with column management
const ResourceTable: React.FC<{data: K8sResourceKind[]}> = ({data}) => {
  const columns: TableColumn<K8sResourceKind>[] = [
    {id: 'name', title: 'Name', sort: 'metadata.name'},
    {id: 'namespace', title: 'Namespace', sort: 'metadata.namespace'},
    {id: 'status', title: 'Status', additional: true}, // hidden by default
    {id: 'created', title: 'Created', sort: 'metadata.creationTimestamp'},
    {id: '', title: '', props: {className: 'dropdown-kebab-pf'}} // always visible
  ];

  const [activeColumns, userSettingsLoaded] = useActiveColumns({
    columns,
    columnManagementID: 'core~v1~Pod', // unique ID for this table
    showNamespaceOverride: false
  });

  if (!userSettingsLoaded) {
    return <TableSkeleton columns={columns} />;
  }

  return <VirtualizedTable columns={activeColumns} data={data} />;
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Configuration object for column management |
| `` | options.columns Array of all available TableColumn objects that define the table structure |
| `` | options.showNamespaceOverride Optional boolean to force namespace column visibility regardless of current namespace context |
| `` | options.columnManagementID Optional unique identifier for persisting column preferences. Should be in format "group~version~kind" for resources |



### Returns

Tuple containing:<br/>  - `activeColumns`: Filtered array of columns that should be displayed based on user preferences<br/>  - `userSettingsLoaded`: Boolean indicating if user settings have been loaded from storage


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useActiveNamespace`

### Summary 

Hook that provides the currently active namespace and a callback for setting the active namespace.<br/><br/>This hook integrates with the Console's global namespace context, which affects resource listings,<br/>routing, and access control throughout the application.<br/><br/>**Common use cases:**<br/>- Building namespace-aware components that filter resources<br/>- Creating custom namespace selectors<br/>- Implementing namespace-scoped operations<br/><br/>**Special values:**<br/>- Returns `undefined` when no namespace is selected (cluster-scoped view)<br/>- Returns `"#ALL_NS#"` constant when "All Namespaces" is selected<br/>- For namespaced resources, always returns a specific namespace string<br/><br/>**Routing integration:**<br/>- Changing namespace automatically updates URL parameters<br/>- Namespace changes trigger navigation to maintain consistency<br/>- Preserves other URL state (filters, search terms, etc.)<br/><br/>**Edge cases:**<br/>- Initial value may be `undefined` during app bootstrap<br/>- Setting an invalid namespace name may cause access issues<br/>- Some pages may override namespace behavior (e.g., cluster settings)


### Example

```tsx
// Basic namespace-aware resource listing
const ResourceList: React.FC = () => {
  const [activeNamespace] = useActiveNamespace();
  const [resources] = useK8sWatchResources({
    pods: {
      kind: 'Pod',
      namespace: activeNamespace, // automatically filters by namespace
      isList: true
    }
  });

  return <PodsList data={resources.pods.data} />;
};
```





### Returns

Tuple containing:<br/>  - `activeNamespace`: Currently selected namespace string, `undefined` for all namespaces, or special constant for cluster-wide view<br/>  - `setActiveNamespace`: Function to change the active namespace, accepts namespace string or `undefined` for all namespaces


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

A hook that provides a callback to launch a modal for editing Kubernetes resource annotations.<br/><br/>This hook creates a standardized annotations editor that allows users to add, edit, and remove<br/>annotations on any Kubernetes resource with proper validation and access control.<br/><br/>**Common use cases:**<br/>- Adding edit actions to resource detail pages<br/>- Implementing annotation management in kebab menus<br/>- Creating annotation-based workflows (e.g., setting deployment annotations)<br/><br/>**Annotation handling:**<br/>- Preserves existing annotations while allowing edits<br/>- Validates annotation keys according to Kubernetes standards<br/>- Handles special annotations (like finalizers) appropriately<br/>- Supports both user-defined and system annotations<br/><br/>**Access control:**<br/>- Automatically validates user permissions to update the resource<br/>- Handles RBAC for patch operations on the specific resource type<br/>- Shows appropriate errors for insufficient permissions<br/><br/>**Edge cases:**<br/>- Returns no-op function if resource is undefined/null<br/>- Handles read-only resources gracefully<br/>- Preserves annotation formatting and encoding<br/>- Validates annotation key/value constraints (length, characters, etc.)


### Example

```tsx
// Basic annotations editor button
const EditAnnotationsButton: React.FC<{resource: K8sResourceCommon}> = ({resource}) => {
  const launchAnnotationsModal = useAnnotationsModal(resource);
  const { t } = useTranslation();

  return (
    <Button
      variant="secondary"
      onClick={launchAnnotationsModal}
      isDisabled={!resource?.metadata}
    >
      {t('Edit Annotations')}
    </Button>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | The Kubernetes resource to edit annotations for. Must be a valid K8sResourceCommon object with metadata |



### Returns

Function that when called, opens the annotations editor modal. Returns no-op if resource is invalid


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useDeleteModal`

### Summary 

A hook that provides a callback to launch a modal for deleting Kubernetes resources.<br/><br/>This hook creates a standardized delete confirmation modal that handles resource deletion<br/>with proper validation, access control, and user feedback.<br/><br/>**Common use cases:**<br/>- Adding delete buttons to resource rows in tables<br/>- Implementing delete actions in kebab menus<br/>- Creating bulk delete operations<br/><br/>**Access control:**<br/>- Modal automatically checks user permissions before allowing deletion<br/>- Handles RBAC validation for the specific resource and namespace<br/>- Shows appropriate error messages for insufficient permissions<br/><br/>**Deletion behavior:**<br/>- Performs proper Kubernetes API calls with error handling<br/>- Shows loading states during deletion process<br/>- Handles finalizers and graceful deletion timeouts<br/>- Automatically updates resource watches after successful deletion<br/><br/>**Edge cases:**<br/>- Returns no-op function if resource is undefined/null<br/>- Handles resources with protection finalizers<br/>- Gracefully fails if resource no longer exists<br/>- Supports cascade deletion for resources with dependents


### Example

```tsx
// Basic delete button for a single resource
const DeletePodButton: React.FC<{pod: PodKind}> = ({pod}) => {
  const launchDeleteModal = useDeleteModal(pod);
  const { t } = useTranslation();

  return (
    <Button
      variant="danger"
      onClick={launchDeleteModal}
      isDisabled={!pod}
    >
      {t('Delete Pod')}
    </Button>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | The Kubernetes resource to delete. Must be a valid K8sResourceCommon object with metadata |
| `redirectTo` | Optional URL to navigate to after successful deletion. Can be string path or LocationDescriptor object |
| `message` | Optional custom message to display in the confirmation modal. Defaults to standard deletion warning |
| `btnText` | Optional text for the delete button. Defaults to "Delete" |
| `deleteAllResources` | Optional custom function to handle deletion. If provided, overrides default deletion behavior. Useful for bulk operations or custom cleanup logic |



### Returns

Function that when called, opens the delete confirmation modal. Returns no-op if resource is invalid


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

Hook that retrieves the Kubernetes model definition for a specific resource type.<br/><br/>K8s models contain essential metadata about resource types including API paths,<br/>namespacing behavior, and display properties. This hook is fundamental for any<br/>component that needs to interact with Kubernetes resources.<br/><br/>**Common use cases:**<br/>- Validating if a resource type exists before making API calls<br/>- Getting API group/version information for resource operations<br/>- Determining if a resource is namespaced or cluster-scoped<br/>- Building dynamic UIs that work with multiple resource types<br/><br/>**Model discovery:**<br/>- Models are loaded from API server discovery endpoints<br/>- Custom Resource models are dynamically registered<br/>- Static models for core Kubernetes resources are pre-loaded<br/>- Plugin-defined models are automatically integrated<br/><br/>**Performance considerations:**<br/>- Models are cached in Redux store for efficient access<br/>- Hook returns immediately with cached data when available<br/>- Model loading is a one-time operation per resource type<br/>- Uses selectors to minimize re-renders<br/><br/>**Model properties:**<br/>- `apiGroup`, `apiVersion`: API endpoint information<br/>- `kind`, `plural`: Resource type identifiers<br/>- `namespaced`: Boolean indicating namespace scoping<br/>- `verbs`: Available operations (get, list, create, etc.)<br/>- `crd`: Boolean indicating if this is a Custom Resource<br/><br/>**Edge cases:**<br/>- Returns undefined model for unknown resource types<br/>- inFlight is true during initial API discovery<br/>- Legacy string references are supported but deprecated<br/>- Model may be undefined until discovery completes


### Example

```tsx
// Basic model lookup for API operations
const ResourceActions: React.FC<{groupVersionKind: K8sGroupVersionKind}> = ({groupVersionKind}) => {
  const [model, inFlight] = useK8sModel(groupVersionKind);

  if (inFlight) {
    return <Spinner size="sm" />;
  }

  if (!model) {
    return <Alert variant="warning">Unknown resource type</Alert>;
  }

  const canCreate = model.verbs?.includes('create');
  const isNamespaced = model.namespaced;

  return (
    <div>
      <h3>{model.kind} ({model.apiVersion})</h3>
      <p>Namespaced: {isNamespaced ? 'Yes' : 'No'}</p>
      {canCreate && <Button>Create {model.kind}</Button>}
    </div>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `groupVersionKind` | Resource type identifier. Preferred format is `K8sGroupVersionKind` object with `group`, `version`, and `kind` properties. Legacy string format `group~version~kind` is deprecated but supported |



### Returns

Tuple containing:<br/>  - `model`: K8sModel object with resource metadata, undefined if resource type unknown<br/>  - `inFlight`: Boolean indicating if API discovery is in progress


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

Hook that retrieves a single Kubernetes resource with live updates and loading states.<br/><br/>This is one of the most important hooks for plugin developers, providing real-time access<br/>to Kubernetes resources with automatic updates, error handling, and loading states.<br/><br/>**Common use cases:**<br/>- Watching a specific resource instance (Pod, Deployment, ConfigMap, etc.)<br/>- Building resource detail pages that stay in sync with cluster state<br/>- Implementing forms that need current resource data<br/><br/>**Watch behavior:**<br/>- Establishes WebSocket connection to Kubernetes API server<br/>- Automatically reconnects on connection failures<br/>- Provides live updates when resource changes in cluster<br/>- Manages resource lifecycle (creation, updates, deletion)<br/><br/>**Performance considerations:**<br/>- Uses Redux for efficient state management and caching<br/>- Automatically deduplicates identical watch requests<br/>- Cleans up WebSocket connections when component unmounts<br/>- Deep compares watch parameters to prevent unnecessary re-subscriptions<br/><br/>**Error handling:**<br/>- Returns loading state during initial fetch<br/>- Provides detailed error objects for network/permission issues<br/>- Handles 404 errors for deleted resources gracefully<br/>- Supports retry logic for transient failures<br/><br/>**Edge cases:**<br/>- Returns empty object/array during initial load<br/>- Handles undefined resource parameter gracefully<br/>- Manages permission errors (403/401) appropriately<br/>- Supports both namespaced and cluster-scoped resources


### Example

```tsx
// Watch a specific Pod
const PodDetails: React.FC<{podName: string, namespace: string}> = ({podName, namespace}) => {
  const [pod, loaded, error] = useK8sWatchResource({
    groupVersionKind: {kind: 'Pod', version: 'v1'},
    name: podName,
    namespace,
  });

  if (error) {
    return <Alert variant="danger">Failed to load pod: {error.message}</Alert>;
  }

  if (!loaded) {
    return <Skeleton />;
  }

  return (
    <div>
      <h1>{pod.metadata.name}</h1>
      <p>Status: {pod.status.phase}</p>
      <p>Node: {pod.spec.nodeName}</p>
    </div>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initResource` | Watch resource configuration object or null/undefined to disable watching. Contains:  - `groupVersionKind` or `kind`: Resource type identifier
  - `name`: Specific resource name to watch
  - `namespace`: Namespace for namespaced resources (omit for cluster-scoped)
  - `isList`: Should be false/undefined for single resource watching |



### Returns

Tuple containing:<br/>  - `resource`: The Kubernetes resource object, empty object during loading, undefined if watching disabled<br/>  - `loaded`: Boolean indicating if initial load completed (true when data available or error occurred)<br/>  - `error`: Error object if watch failed, undefined if successful or still loading


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource.ts)

---

## `useK8sWatchResources`

### Summary 

Hook that retrieves multiple Kubernetes resources simultaneously with live updates and loading states.<br/><br/>This hook is essential for building complex UIs that need to watch multiple related resources<br/>at once, such as dashboards, list pages, and relationship views.<br/><br/>**Common use cases:**<br/>- Dashboard pages showing multiple resource types (Pods, Services, Deployments)<br/>- Resource relationship views (Deployment + ReplicaSets + Pods)<br/>- List pages with related resources (Pods with their owning controllers)<br/>- Overview pages displaying cluster-wide resource counts<br/><br/>**Performance benefits:**<br/>- Efficiently manages multiple WebSocket connections<br/>- Deduplicates identical resource watches across components<br/>- Uses optimized Redux selectors to minimize re-renders<br/>- Batches updates for related resource changes<br/><br/>**Watch behavior:**<br/>- All resources are watched independently with their own lifecycle<br/>- Each resource has its own loading and error states<br/>- Resources can be added/removed dynamically by changing the input object<br/>- Automatically handles model loading and validation<br/><br/>**Memory management:**<br/>- Cleans up all WebSocket connections when component unmounts<br/>- Automatically stops watching resources removed from input<br/>- Uses immutable data structures for efficient change detection<br/><br/>**Error handling:**<br/>- Each resource has independent error handling<br/>- Missing models result in NoModelError for specific resources<br/>- Network errors don't affect other resource watches<br/>- Gracefully handles permission errors per resource<br/><br/>**Edge cases:**<br/>- Empty input object returns empty results immediately<br/>- Invalid resource definitions are skipped with appropriate errors<br/>- Handles mixed namespaced and cluster-scoped resources<br/>- Supports dynamic resource lists that change over time


### Example

```tsx
// Dashboard showing multiple resource types
const ClusterOverview: React.FC = () => {
  const watchResources = {
    pods: {
      kind: 'Pod',
      isList: true,
      namespace: 'default'
    },
    services: {
      kind: 'Service',
      isList: true,
      namespace: 'default'
    },
    deployments: {
      groupVersionKind: {group: 'apps', version: 'v1', kind: 'Deployment'},
      isList: true,
      namespace: 'default'
    }
  };

  const {pods, services, deployments} = useK8sWatchResources(watchResources);

  const allLoaded = pods.loaded && services.loaded && deployments.loaded;
  const hasErrors = pods.loadError || services.loadError || deployments.loadError;

  if (hasErrors) {
    return <ErrorAlert errors={[pods.loadError, services.loadError, deployments.loadError]} />;
  }

  if (!allLoaded) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="cluster-overview">
      <ResourceCard title="Pods" count={pods.data.length} resources={pods.data} />
      <ResourceCard title="Services" count={services.data.length} resources={services.data} />
      <ResourceCard title="Deployments" count={deployments.data.length} resources={deployments.data} />
    </div>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initResources` | Object where keys are unique identifiers and values are watch resource configurations. Each value contains:  - `groupVersionKind` or `kind`: Resource type identifier
  - `isList`: Boolean indicating if watching a list or single resource
  - `namespace`: Namespace for namespaced resources (omit for cluster-scoped)
  - `name`: Specific resource name (for single resource watches)
  - `selector`: Label selector for filtering list results |



### Returns

Object with same keys as input, where each value contains:<br/>  - `data`: The Kubernetes resource(s), empty array/object during loading<br/>  - `loaded`: Boolean indicating if initial load completed for this resource<br/>  - `loadError`: Error object if this specific resource watch failed, undefined if successful


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResources.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResources.ts)

---

## `useLabelsModal`

### Summary 

A hook that provides a callback to launch a modal for editing Kubernetes resource labels.<br/><br/>This hook creates a standardized labels editor that allows users to add, edit, and remove<br/>labels on any Kubernetes resource with proper validation and access control.<br/><br/>**Common use cases:**<br/>- Adding edit actions to resource detail pages<br/>- Implementing label management in kebab menus<br/>- Creating label-based workflows (e.g., setting service selectors)<br/><br/>**Label handling:**<br/>- Preserves existing labels while allowing edits<br/>- Validates label keys and values according to Kubernetes standards<br/>- Handles both user-defined and system labels appropriately<br/>- Supports label selectors and matching logic<br/><br/>**Access control:**<br/>- Automatically validates user permissions to update the resource<br/>- Handles RBAC for patch operations on the specific resource type<br/>- Shows appropriate errors for insufficient permissions<br/><br/>**Validation:**<br/>- Enforces Kubernetes label key/value format rules<br/>- Prevents invalid characters and length violations<br/>- Validates DNS subdomain and name requirements<br/>- Warns about system/reserved label prefixes<br/><br/>**Edge cases:**<br/>- Returns no-op function if resource is undefined/null<br/>- Handles read-only resources gracefully<br/>- Preserves label formatting and encoding<br/>- Prevents editing of protected system labels


### Example

```tsx
// Basic labels editor button
const EditLabelsButton: React.FC<{resource: K8sResourceCommon}> = ({resource}) => {
  const launchLabelsModal = useLabelsModal(resource);
  const { t } = useTranslation();

  return (
    <Button
      variant="secondary"
      onClick={launchLabelsModal}
      isDisabled={!resource?.metadata}
    >
      {t('Edit Labels')}
    </Button>
  );
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `resource` | The Kubernetes resource to edit labels for. Must be a valid K8sResourceCommon object with metadata |



### Returns

Function that when called, opens the labels editor modal. Returns no-op if resource is invalid


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

Sets up a poll to Prometheus for a single query with automatic refresh and error handling.<br/><br/>This hook provides a convenient way to execute Prometheus queries with built-in polling,<br/>error handling, and loading states for building monitoring dashboards and metrics views.<br/><br/>**Common use cases:**<br/>- Building custom monitoring dashboards<br/>- Displaying resource metrics (CPU, memory, network)<br/>- Creating alerting and health status indicators<br/><br/>**Polling behavior:**<br/>- Automatically refreshes data at specified intervals<br/>- Pauses polling when component unmounts or query becomes empty<br/>- Handles network errors and retries appropriately<br/>- Optimizes requests to avoid unnecessary API calls<br/><br/>**Query types:**<br/>- `QUERY`: Instant vector queries for current values<br/>- `QUERY_RANGE`: Range vector queries for time series data<br/>- `LABEL`: Label value queries for dynamic filtering<br/>- `RULES`: Recording and alerting rule queries<br/><br/>**Error handling:**<br/>- Network errors are caught and returned in error state<br/>- Invalid PromQL syntax errors are handled gracefully<br/>- Rate limiting and timeout errors trigger exponential backoff<br/><br/>**Edge cases:**<br/>- Empty or undefined query disables polling<br/>- Invalid endpoint types default to QUERY<br/>- Large result sets may be truncated by Prometheus<br/>- Time range queries require appropriate time boundaries


### Example

```tsx
// Basic CPU usage metric
const CPUUsageChart: React.FC<{podName: string}> = ({podName}) => {
  const [response, loaded, error] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: `rate(container_cpu_usage_seconds_total{pod="${podName}"}[5m])`,
    delay: 30000 // poll every 30 seconds
  });

  if (error) {
    return <Alert variant="danger">Failed to load CPU metrics: {error.message}</Alert>;
  }

  if (!loaded) {
    return <ChartSkeleton />;
  }

  const cpuValue = response?.data?.result?.[0]?.value?.[1];
  return <MetricChart value={cpuValue} title="CPU Usage" />;
};
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `options` | Configuration object for Prometheus polling |
| `` | options.endpoint The Prometheus API endpoint type (QUERY, QUERY_RANGE, LABEL, etc.) |
| `` | options.query Optional Prometheus query string. If empty/undefined, polling is disabled |
| `` | options.delay Optional polling interval in milliseconds. Defaults to 30000 (30 seconds) |
| `` | options.endTime Optional end time for QUERY_RANGE endpoint (Unix timestamp) |
| `` | options.samples Optional number of samples for QUERY_RANGE endpoint |
| `` | options.timespan Optional time range duration for QUERY_RANGE endpoint in milliseconds |
| `` | options.namespace Optional namespace parameter to append to query |
| `` | options.timeout Optional request timeout parameter |



### Returns

Tuple containing:<br/>  - `response`: Prometheus query response object with data and metadata<br/>  - `loaded`: Boolean indicating if the query has completed (true when data is available or error occurred)<br/>  - `error`: Error object if query failed, null otherwise


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useQuickStartContext`

### Summary 

Hook that provides the current quick start context values for plugin integration with Console quick starts.<br/><br/>Quick starts are guided tutorials that help users learn Console features and workflows.<br/>This hook allows plugins to integrate with the quick start system programmatically.<br/><br/>**Common use cases:**<br/>- Launching quick starts from custom UI elements<br/>- Tracking quick start progress for analytics<br/>- Creating contextual help that opens relevant quick starts<br/><br/>**Context values provided:**<br/>- `activeQuickStartID`: Currently active quick start identifier<br/>- `setActiveQuickStart`: Function to programmatically start a quick start<br/>- `allQuickStartStates`: Map of all quick start states and progress<br/>- `setQuickStartState`: Function to update quick start completion state<br/><br/>**Quick start lifecycle:**<br/>- Quick starts can be in progress, completed, or not started<br/>- Users can pause and resume quick starts<br/>- Progress is persisted across sessions<br/><br/>**Edge cases:**<br/>- Setting invalid quick start ID fails silently<br/>- Quick starts may not be available in all Console configurations<br/>- Context values may be undefined during initial load


### Example

```tsx
// Button to launch a specific quick start
const LaunchTutorialButton: React.FC<{quickStartId: string, title: string}> = ({quickStartId, title}) => {
  const { setActiveQuickStart, allQuickStartStates } = useQuickStartContext();
  const quickStartState = allQuickStartStates[quickStartId];

  const handleClick = React.useCallback(() => {
    setActiveQuickStart(quickStartId);
  }, [quickStartId, setActiveQuickStart]);

  const isCompleted = quickStartState?.status === 'Complete';
  const buttonText = isCompleted ? `Review ${title}` : `Start ${title}`;

  return (
    <Button variant={isCompleted ? 'secondary' : 'primary'} onClick={handleClick}>
      {buttonText}
      {isCompleted && <CheckCircleIcon className="ml-2" />}
    </Button>
  );
};
```





### Returns

QuickStartContextValues object containing:<br/>  - `activeQuickStartID`: String ID of currently active quick start, null if none active<br/>  - `setActiveQuickStart`: Function to start a quick start by ID<br/>  - `allQuickStartStates`: Object mapping quick start IDs to their current state and progress<br/>  - `setQuickStartState`: Function to programmatically update quick start state<br/>  - Additional context values for advanced quick start management


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useResolvedExtensions`

### Summary 

React hook for consuming Console extensions with resolved `CodeRef` properties.<br/><br/>This hook is essential for plugin development as it resolves dynamic imports (CodeRefs) that point to<br/>remote module components. It's commonly used when building extension points that need to load components<br/>from different plugins.<br/><br/>**Common use cases:**<br/>- Building navigation extensions that load components from multiple plugins<br/>- Creating action extensions that reference components in other modules<br/>- Implementing dashboard cards that come from various plugins<br/><br/>**Performance considerations:**<br/>- The hook uses async resolution, so components should handle loading states<br/>- Results are memoized and referentially stable across re-renders<br/>- Failed resolutions are logged to console and returned in the errors array<br/><br/>**Edge cases:**<br/>- Returns empty array initially until resolution completes<br/>- If CodeRef resolution fails, those extensions are excluded from results<br/>- When extension list changes, previous results are returned until new resolution completes


### Example

```tsx
// Basic usage for nav item extensions
const [navItemExtensions, navItemsResolved, errors] = useResolvedExtensions<NavItem>(isNavItem);

if (!navItemsResolved) {
  return <LoadingSpinner />;
}

if (errors.length > 0) {
  console.warn('Some extensions failed to load:', errors);
}

return (
  <nav>
    {navItemExtensions.map(ext => (
      <ext.properties.component key={ext.uid} />
    ))}
  </nav>
);
```



### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `typeGuards` | A list of type guard functions that filter extensions. Each function receives an extension and returns boolean indicating type match. Common guards: `isNavItem`, `isResourceAction`, `isDashboardCard` |



### Returns

Tuple containing:<br/>  - `extensions`: Array of resolved extension instances with CodeRefs converted to actual components<br/>  - `resolved`: Boolean indicating if async resolution is complete (false during initial load)<br/>  - `errors`: Array of errors from failed CodeRef resolutions (useful for debugging)


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/api/dynamic-core-api.ts)

---

## `useUserSettings`

### Summary 

Hook that provides a user setting value and a callback for setting the user setting value.<br/><br/>This hook integrates with the Console's user settings system, allowing plugins to store<br/>and retrieve user preferences that persist across sessions.<br/><br/>**Common use cases:**<br/>- Storing user interface preferences (theme, layout, default values)<br/>- Persisting form state and user selections<br/>- Managing feature flags and user-specific configurations<br/><br/>**Storage behavior:**<br/>- Settings are stored in user's ConfigMap or localStorage fallback<br/>- Values persist across browser sessions and page reloads<br/>- Settings are user-specific and don't affect other users<br/><br/>**Setting key format:**<br/>- Use dot notation for hierarchical settings (e.g., 'plugin.feature.option')<br/>- Plugin settings should be prefixed with plugin name<br/>- System settings use reserved prefixes<br/><br/>**Edge cases:**<br/>- Returns default value if setting hasn't been set yet<br/>- May return stale value briefly during async loading<br/>- Setting undefined values removes the setting<br/>- Complex objects are JSON serialized/deserialized


### Example

```tsx
// Basic preference storage
const PreferenceComponent: React.FC = () => {
  const [showAdvanced, setShowAdvanced, loaded] = useUserSettings(
    'myPlugin.showAdvancedOptions',
    false, // default value
    true   // sync immediately
  );

  if (!loaded) {
    return <Loading />;
  }

  return (
    <>
      <Checkbox
        isChecked={showAdvanced}
        onChange={setShowAdvanced}
        label="Show advanced options"
      />
      {showAdvanced && <AdvancedOptionsPanel />}
    </>
  );
};
```





### Returns

Tuple containing:<br/>  - `value`: Current setting value, or default value if not set<br/>  - `setValue`: Function to update the setting value, accepts new value or function that receives current value<br/>  - `loaded`: Boolean indicating if the setting has been loaded from storage


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

## `useSafetyFirst`

### Summary [DEPRECATED]

@deprecated - This hook is not related to console functionality.<br/>Hook that ensures a safe asynchronnous setting of the React state in case a given component could be unmounted.<br/>(https://github.com/facebook/react/issues/14113)




### Parameters

| Parameter Name | Description |
| -------------- | ----------- |
| `initialState` | initial state value |



### Returns

An array with a pair of state value and its set function.


### Source

[`frontend/packages/console-dynamic-plugin-sdk/src/app/components/safety-first.tsx`](https://github.com/openshift/console/tree/main/frontend/packages/console-dynamic-plugin-sdk/src/app/components/safety-first.tsx)

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

