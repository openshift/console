# OpenShift Console Extension Types

1.  [`console.action/filter`](#consoleactionfilter)
2.  [`console.action/group`](#consoleactiongroup)
3.  [`console.action/provider`](#consoleactionprovider)
4.  [`console.action/resource-provider`](#consoleactionresource-provider)
5.  [`console.alert-action`](#consolealert-action)
6.  [`console.catalog/item-filter`](#consolecatalogitem-filter)
7.  [`console.catalog/item-metadata`](#consolecatalogitem-metadata)
8.  [`console.catalog/item-provider`](#consolecatalogitem-provider)
9.  [`console.catalog/item-type`](#consolecatalogitem-type)
10.  [`console.catalog/item-type-metadata`](#consolecatalogitem-type-metadata)
11.  [`console.cluster-overview/inventory-item`](#consolecluster-overviewinventory-item)
12.  [`console.cluster-overview/multiline-utilization-item`](#consolecluster-overviewmultiline-utilization-item)
13.  [`console.cluster-overview/utilization-item`](#consolecluster-overviewutilization-item)
14.  [`console.context-provider`](#consolecontext-provider)
15.  [`console.dashboards/card`](#consoledashboardscard)
16.  [`console.dashboards/custom/overview/detail/item`](#consoledashboardscustomoverviewdetailitem)
17.  [`console.dashboards/overview/activity/resource`](#consoledashboardsoverviewactivityresource)
18.  [`console.dashboards/overview/health/operator`](#consoledashboardsoverviewhealthoperator)
19.  [`console.dashboards/overview/health/prometheus`](#consoledashboardsoverviewhealthprometheus)
20.  [`console.dashboards/overview/health/resource`](#consoledashboardsoverviewhealthresource)
21.  [`console.dashboards/overview/health/url`](#consoledashboardsoverviewhealthurl)
22.  [`console.dashboards/overview/inventory/item`](#consoledashboardsoverviewinventoryitem)
23.  [`console.dashboards/overview/inventory/item/group`](#consoledashboardsoverviewinventoryitemgroup)
24.  [`console.dashboards/overview/inventory/item/replacement`](#consoledashboardsoverviewinventoryitemreplacement)
25.  [`console.dashboards/overview/prometheus/activity/resource`](#consoledashboardsoverviewprometheusactivityresource)
26.  [`console.dashboards/project/overview/item`](#consoledashboardsprojectoverviewitem)
27.  [`console.dashboards/tab`](#consoledashboardstab)
28.  [`console.file-upload`](#consolefile-upload)
29.  [`console.flag`](#consoleflag)
30.  [`console.flag/hookProvider`](#consoleflaghookProvider)
31.  [`console.flag/model`](#consoleflagmodel)
32.  [`console.global-config`](#consoleglobal-config)
33.  [`console.model-metadata`](#consolemodel-metadata)
34.  [`console.navigation/href`](#consolenavigationhref)
35.  [`console.navigation/resource-cluster`](#consolenavigationresource-cluster)
36.  [`console.navigation/resource-ns`](#consolenavigationresource-ns)
37.  [`console.navigation/section`](#consolenavigationsection)
38.  [`console.navigation/separator`](#consolenavigationseparator)
39.  [`console.page/resource/details`](#consolepageresourcedetails)
40.  [`console.page/resource/list`](#consolepageresourcelist)
41.  [`console.page/route`](#consolepageroute)
42.  [`console.page/route/standalone`](#consolepageroutestandalone)
43.  [`console.perspective`](#consoleperspective)
44.  [`console.project-overview/inventory-item`](#consoleproject-overviewinventory-item)
45.  [`console.project-overview/utilization-item`](#consoleproject-overviewutilization-item)
46.  [`console.pvc/alert`](#consolepvcalert)
47.  [`console.pvc/create-prop`](#consolepvccreate-prop)
48.  [`console.pvc/delete`](#consolepvcdelete)
49.  [`console.pvc/status`](#consolepvcstatus)
50.  [`console.redux-reducer`](#consoleredux-reducer)
51.  [`console.resource/create`](#consoleresourcecreate)
52.  [`console.storage-class/provisioner`](#consolestorage-classprovisioner)
53.  [`console.storage-provider`](#consolestorage-provider)
54.  [`console.tab/horizontalNav`](#consoletabhorizontalNav)
55.  [`console.telemetry/listener`](#consoletelemetrylistener)
56.  [`console.topology/adapter/build`](#consoletopologyadapterbuild)
57.  [`console.topology/adapter/network`](#consoletopologyadapternetwork)
58.  [`console.topology/adapter/pod`](#consoletopologyadapterpod)
59.  [`console.topology/component/factory`](#consoletopologycomponentfactory)
60.  [`console.topology/create/connector`](#consoletopologycreateconnector)
61.  [`console.topology/data/factory`](#consoletopologydatafactory)
62.  [`console.topology/decorator/provider`](#consoletopologydecoratorprovider)
63.  [`console.topology/details/resource-alert`](#consoletopologydetailsresource-alert)
64.  [`console.topology/details/resource-link`](#consoletopologydetailsresource-link)
65.  [`console.topology/details/tab`](#consoletopologydetailstab)
66.  [`console.topology/details/tab-section`](#consoletopologydetailstab-section)
67.  [`console.topology/display/filters`](#consoletopologydisplayfilters)
68.  [`console.topology/relationship/provider`](#consoletopologyrelationshipprovider)
69.  [`console.user-preference/group`](#consoleuser-preferencegroup)
70.  [`console.user-preference/item`](#consoleuser-preferenceitem)
71.  [`console.yaml-template`](#consoleyaml-template)
72.  [`dev-console.add/action`](#dev-consoleaddaction)
73.  [`dev-console.add/action-group`](#dev-consoleaddaction-group)
74.  [`dev-console.import/environment`](#dev-consoleimportenvironment)
75. [DEPRECATED] [`console.dashboards/overview/detail/item`](#consoledashboardsoverviewdetailitem)
76. [DEPRECATED] [`console.page/resource/tab`](#consolepageresourcetab)

---

## `console.action/filter`

### Summary 

ActionFilter can be used to filter an action

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `contextId` | `string` | no | The context ID helps to narrow the scope of contributed actions to a particular area of the application. Ex - topology, helm |
| `filter` | `CodeRef<(scope: any, action: Action) => boolean>` | no | A function which will filter actions based on some conditions.<br/>scope: The scope in which actions should be provided for.<br/>Note: hook may be required if we want to remove the ModifyCount action from a deployment with HPA |

---

## `console.action/group`

### Summary 

ActionGroup contributes an action group that can also be a submenu

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | ID used to identify the action section. |
| `label` | `string` | yes | The label to display in the UI.<br/>Required for submenus. |
| `submenu` | `boolean` | yes | Whether this group should be displayed as submenu |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here.<br/>For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here.<br/>For arrays, the first one found in order is used.<br/>insertBefore takes precedence. |

---

## `console.action/provider`

### Summary 

ActionProvider contributes a hook that returns list of actions for specific context

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `contextId` | `string` | no | The context ID helps to narrow the scope of contributed actions to a particular area of the application. Ex - topology, helm |
| `provider` | `CodeRef<ExtensionHook<Action[], any>>` | no | A react hook which returns actions for the given scope.<br/>If contextId = `resource` then the scope will always be a K8s resource object |

---

## `console.action/resource-provider`

### Summary 

ResourceActionProvider contributes a hook that returns list of actions for specific resource model

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sKindVersionModel` | no | The model for which this provider provides actions for. |
| `provider` | `CodeRef<ExtensionHook<Action[], any>>` | no | A react hook which returns actions for the given resource model |

---

## `console.alert-action`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `alert` | `string` | no |  |
| `text` | `string` | no |  |
| `action` | `CodeRef<(alert: Alert, launchModal: LaunchModal) => void>` | no |  |

---

## `console.catalog/item-filter`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `catalogId` | `string \| string[]` | no | The unique identifier for the catalog this provider contributes to. |
| `type` | `string` | no | Type ID for the catalog item type. |
| `filter` | `CodeRef<(item: CatalogItem) => boolean>` | no | Filters items of a specific type. Value is a function that takes CatalogItem[] and returns a subset based on the filter criteria. |

---

## `console.catalog/item-metadata`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `catalogId` | `string \| string[]` | no | The unique identifier for the catalog this provider contributes to. |
| `type` | `string` | no | Type ID for the catalog item type. |
| `provider` | `CodeRef<ExtensionHook<CatalogItemMetadataProviderFunction, CatalogExtensionHookOptions>>` | no | A hook which returns a function that will be used to provide metadata to catalog items of a specific type. |

---

## `console.catalog/item-provider`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `catalogId` | `string \| string[]` | no | The unique identifier for the catalog this provider contributes to. |
| `type` | `string` | no | Type ID for the catalog item type. |
| `title` | `string` | no | Title for the catalog item provider |
| `provider` | `CodeRef<ExtensionHook<CatalogItem<any>[], CatalogExtensionHookOptions>>` | no | Fetch items and normalize it for the catalog. Value is a react effect hook. |
| `priority` | `number` | yes | Priority for this provider. Defaults to 0. Higher priority providers may override catalog<br/>items provided by other providers. |

---

## `console.catalog/item-type`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `type` | `string` | no | Type for the catalog item. |
| `title` | `string` | no | Title for the catalog item. |
| `catalogDescription` | `string \| CodeRef<React.ReactNode>` | yes | Description for the type specific catalog. |
| `typeDescription` | `string` | yes | Description for the catalog item type. |
| `filters` | `CatalogItemAttribute[]` | yes | Custom filters specific to the catalog item. |
| `groupings` | `CatalogItemAttribute[]` | yes | Custom groupings specific to the catalog item. |

---

## `console.catalog/item-type-metadata`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `type` | `string` | no | Type for the catalog item. |
| `filters` | `CatalogItemAttribute[]` | yes | Custom filters specific to the catalog item. |
| `groupings` | `CatalogItemAttribute[]` | yes | Custom groupings specific to the catalog item. |

---

## `console.cluster-overview/inventory-item`

### Summary 

Adds a new inventory item into cluster overview page.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `component` | `CodeRef<React.ComponentType<{}>>` | no | The component to be rendered. |

---

## `console.cluster-overview/multiline-utilization-item`

### Summary 

Adds a new cluster overview multiline utilization item.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no | The title of the utilization item. |
| `getUtilizationQueries` | `CodeRef<GetMultilineQueries>` | no | Prometheus utilization query. |
| `humanize` | `CodeRef<Humanize>` | no | Convert prometheus data to human readable form. |
| `TopConsumerPopovers` | `CodeRef<React.ComponentType<TopConsumerPopoverProps>[]>` | yes | Shows Top consumer popover instead of plain value |

---

## `console.cluster-overview/utilization-item`

### Summary 

Adds a new cluster overview utilization item.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no | The title of the utilization item. |
| `getUtilizationQuery` | `CodeRef<GetQuery>` | no | Prometheus utilization query. |
| `humanize` | `CodeRef<Humanize>` | no | Convert prometheus data to human readable form. |
| `getTotalQuery` | `CodeRef<GetQuery>` | yes | Prometheus total query. |
| `getRequestQuery` | `CodeRef<GetQuery>` | yes | Prometheus request query. |
| `getLimitQuery` | `CodeRef<GetQuery>` | yes | Prometheus limit query. |
| `TopConsumerPopover` | `CodeRef<React.ComponentType<TopConsumerPopoverProps>>` | yes | Shows Top consumer popover instead of plain value |

---

## `console.context-provider`

### Summary 

Adds new React context provider to Console application root.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `provider` | `CodeRef<Provider<T>>` | no | Context Provider component. |
| `useValueHook` | `CodeRef<() => T>` | no | Hook for the Context value. |

---

## `console.dashboards/card`

### Summary 

Adds a new dashboard card.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `tab` | `string` | no | The id of the dashboard tab to which the card will be added. |
| `position` | `'LEFT' \| 'RIGHT' \| 'MAIN'` | no | The grid position of the card on the dashboard. |
| `component` | `CodeRef<React.ComponentType<{}>>` | no | Dashboard card component. |
| `span` | `OverviewCardSpan` | yes | Card's vertical span in the column. Ignored for small screens, defaults to 12. |

---

## `console.dashboards/custom/overview/detail/item`

### Summary 

Adds an item to the Details card of Overview Dashboard

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no |  |
| `component` | `CodeRef<React.ComponentType<{}>>` | no | The value, rendered by the OverviewDetailItem component |
| `valueClassName` | `string` | yes |  |
| `isLoading` | `CodeRef<() => boolean>` | yes | Function returning the loading state of the component |
| `error` | `CodeRef<() => string>` | yes | Function returning errors to be displayed by the component |

---

## `console.dashboards/overview/activity/resource`

### Summary 

Adds an activity to the Activity Card of Overview Dashboard where the triggering of activity is based on watching a K8s resource.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `k8sResource` | `CodeRef<FirehoseResource & { isList: true; }>` | no | The utilization item to be replaced. |
| `component` | `CodeRef<React.ComponentType<K8sActivityProps<T>>>` | no | The action component. |
| `isActivity` | `CodeRef<(resource: T) => boolean>` | yes | Function which determines if the given resource represents the action. If not defined, every resource represents activity. |
| `getTimestamp` | `CodeRef<(resource: T) => Date>` | yes | Timestamp for the given action, which will be used for ordering. |

---

## `console.dashboards/overview/health/operator`

### Summary 

Adds a health subsystem to the status card of Overview dashboard where the source of status is a K8s REST API.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no | Title of operators section in the popup. |
| `resources` | `CodeRef<FirehoseResource[]>` | no | Kubernetes resources which will be fetched and passed to `healthHandler`. |
| `getOperatorsWithStatuses` | `CodeRef<GetOperatorsWithStatuses<T>>` | yes | Resolves status for the operators. |
| `operatorRowLoader` | `CodeRef<React.ComponentType<OperatorRowProps<T>>>` | yes | Loader for popup row component. |
| `viewAllLink` | `string` | yes | Links to all resources page. If not provided then a list page of the first resource from resources prop is used. |

---

## `console.dashboards/overview/health/prometheus`

### Summary 

Adds a health subsystem to the status card of Overview dashboard where the source of status is Prometheus.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no | The display name of the subsystem. |
| `queries` | `string[]` | no | The Prometheus queries |
| `healthHandler` | `CodeRef<PrometheusHealthHandler>` | no | Resolve the subsystem's health. |
| `additionalResource` | `CodeRef<FirehoseResource>` | yes | Additional resource which will be fetched and passed to `healthHandler`. |
| `popupComponent` | `CodeRef<React.ComponentType<PrometheusHealthPopupProps>>` | yes | Loader for popup content. If defined, a health item will be represented as a link which opens popup with given content. |
| `popupTitle` | `string` | yes | The title of the popover. |
| `popupClassname` | `string` | yes | Optional classname for the popup top-level component. |
| `popupKeepOnOutsideClick` | `boolean` | yes | If true, the popup will stay open when clicked outside of its boundary. Default: false |
| `disallowedControlPlaneTopology` | `string[]` | yes | Control plane topology for which the subsystem should be hidden. |

---

## `console.dashboards/overview/health/resource`

### Summary 

Adds a health subsystem to the status card of Overview dashboard where the source of status is a K8s Resource.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no | The display name of the subsystem. |
| `resources` | `CodeRef<WatchK8sResources<T>>` | no | Kubernetes resources which will be fetched and passed to `healthHandler`. |
| `healthHandler` | `CodeRef<ResourceHealthHandler<T>>` | no | Resolve the subsystem's health. |
| `popupComponent` | `CodeRef<WatchK8sResults<T>>` | yes | Loader for popup content. If defined, a health item will be represented as a link which opens popup with given content. |
| `popupTitle` | `string` | yes | The title of the popover. |

---

## `console.dashboards/overview/health/url`

### Summary 

Adds a health subsystem to the status card of Overview dashboard where the source of status is a K8s REST API.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no | The display name of the subsystem. |
| `url` | `string` | no | The URL to fetch data from. It will be prefixed with base k8s URL. |
| `healthHandler` | `CodeRef<URLHealthHandler<T, K8sResourceCommon \| K8sResourceCommon[]>>` | no | Resolve the subsystem's health. |
| `additionalResource` | `CodeRef<FirehoseResource>` | yes | Additional resource which will be fetched and passed to `healthHandler`. |
| `popupComponent` | `CodeRef<React.ComponentType<{ healthResult?: T; healthResultError?: any; k8sResult?: FirehoseResult<R>; }>>` | yes | Loader for popup content. If defined, a health item will be represented as a link which opens popup with given content. |
| `popupTitle` | `string` | yes | The title of the popover. |

---

## `console.dashboards/overview/inventory/item`

### Summary 

Adds a resource tile to the overview inventory card.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `CodeRef<T>` | no | The model for `resource` which will be fetched. Used to get the model's `label` or `abbr`. |
| `mapper` | `CodeRef<StatusGroupMapper<T, R>>` | yes | Function which maps various statuses to groups. |
| `additionalResources` | `CodeRef<WatchK8sResources<R>>` | yes | Additional resources which will be fetched and passed to the `mapper` function. |

---

## `console.dashboards/overview/inventory/item/group`

### Summary 

Adds an inventory status group.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | The id of the status group. |
| `icon` | `CodeRef<React.ReactElement<any, string \| React.JSXElementConstructor<any>>>` | no | React component representing the status group icon. |

---

## `console.dashboards/overview/inventory/item/replacement`

### Summary 

Replaces an overview inventory card.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `CodeRef<T>` | no | The model for `resource` which will be fetched. Used to get the model's `label` or `abbr`. |
| `mapper` | `CodeRef<StatusGroupMapper<T, R>>` | yes | Function which maps various statuses to groups. |
| `additionalResources` | `CodeRef<WatchK8sResources<R>>` | yes | Additional resources which will be fetched and passed to the `mapper` function. |

---

## `console.dashboards/overview/prometheus/activity/resource`

### Summary 

Adds an activity to the Activity Card of Prometheus Overview Dashboard where the triggering of activity is based on watching a K8s resource.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `queries` | `string[]` | no | Queries to watch |
| `component` | `CodeRef<React.ComponentType<PrometheusActivityProps>>` | no | The action component. |
| `isActivity` | `CodeRef<(results: PrometheusResponse[]) => boolean>` | yes | Function which determines if the given resource represents the action. If not defined, every resource represents activity. |

---

## `console.dashboards/project/overview/item`

### Summary 

Adds a resource tile to the project overview inventory card.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `CodeRef<T>` | no | The model for `resource` which will be fetched. Used to get the model's `label` or `abbr`. |
| `mapper` | `CodeRef<StatusGroupMapper<T, R>>` | yes | Function which maps various statuses to groups. |
| `additionalResources` | `CodeRef<WatchK8sResources<R>>` | yes | Additional resources which will be fetched and passed to the `mapper` function. |

---

## `console.dashboards/tab`

### Summary 

Adds a new dashboard tab, placed after the Overview tab.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique tab identifier, used as tab link `href` and when adding cards to this tab. |
| `navSection` | `'home' \| 'storage'` | no | NavSection to which the tab belongs to |
| `title` | `string` | no | The title of the tab. |

---

## `console.file-upload`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `fileExtensions` | `string[]` | no | Supported file extensions. |
| `handler` | `CodeRef<FileUploadHandler>` | no | Function which handles the file drop action. |

---

## `console.flag`

### Summary 

Gives full control over Console feature flags.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `handler` | `CodeRef<FeatureFlagHandler>` | no | Used to set/unset arbitrary feature flags. |

---

## `console.flag/hookProvider`

### Summary 

Gives full control over Console feature flags with hook handlers.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `handler` | `CodeRef<FeatureFlagHandler>` | no | Used to set/unset arbitrary feature flags. |

---

## `console.flag/model`

### Summary 

Adds new Console feature flag driven by the presence of a CRD on the cluster.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `flag` | `string` | no | The name of the flag to set once the CRD is detected. |
| `model` | `ExtensionK8sModel` | no | The model which refers to a `CustomResourceDefinition`. |

---

## `console.global-config`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | Unique identifier for the cluster config resource instance. |
| `name` | `string` | no | The name of the cluster config resource instance. |
| `model` | `ExtensionK8sModel` | no | The model which refers to a cluster config resource. |
| `namespace` | `string` | no | The namespace of the cluster config resource instance. |

---

## `console.model-metadata`

### Summary 

Customize the display of models by overriding values retrieved and generated through API discovery.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sGroupModel` | no | The model to customize. May specify only a group, or optional version and kind. |
| `badge` | `ModelBadge` | yes | Whether to consider this model reference as tech preview or dev preview. |
| `color` | `string` | yes | The color to associate to this model. |
| `label` | `string` | yes | Override the label. Requires `kind` be provided. |
| `labelPlural` | `string` | yes | Override the plural label. Requires `kind` be provided. |
| `abbr` | `string` | yes | Customize the abbreviation. Defaults to All uppercase chars in the kind up to 4 characters long. Requires `kind` be provided. |

---

## `console.navigation/href`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique identifier for this item. |
| `name` | `string` | no | The name of this item. |
| `href` | `string` | no | The link href value. |
| `perspective` | `string` | yes | The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. |
| `section` | `string` | yes | Navigation section to which this item belongs to. If not specified, render this item as a top level link. |
| `dataAttributes` | `{ [key: string]: string; }` | yes | Adds data attributes to the DOM. |
| `startsWith` | `string[]` | yes | Mark this item as active when the URL starts with one of these paths. |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here. For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. |
| `namespaced` | `boolean` | yes | if true, adds /ns/active-namespace to the end |
| `prefixNamespaced` | `boolean` | yes | if true, adds /k8s/ns/active-namespace to the begining |

---

## `console.navigation/resource-cluster`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique identifier for this item. |
| `model` | `ExtensionK8sModel` | no | The model for which this nav item links to. |
| `perspective` | `string` | yes | The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. |
| `section` | `string` | yes | Navigation section to which this item belongs to. If not specified, render this item as a top level link. |
| `dataAttributes` | `{ [key: string]: string; }` | yes | Adds data attributes to the DOM. |
| `startsWith` | `string[]` | yes | Mark this item as active when the URL starts with one of these paths. |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here. For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. |
| `name` | `string` | yes | Overrides the default name. If not supplied the name of the link will equal the plural value of the model. |

---

## `console.navigation/resource-ns`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique identifier for this item. |
| `model` | `ExtensionK8sModel` | no | The model for which this nav item links to. |
| `perspective` | `string` | yes | The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. |
| `section` | `string` | yes | Navigation section to which this item belongs to. If not specified, render this item as a top level link. |
| `dataAttributes` | `{ [key: string]: string; }` | yes | Adds data attributes to the DOM. |
| `startsWith` | `string[]` | yes | Mark this item as active when the URL starts with one of these paths. |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here. For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. |
| `name` | `string` | yes | Overrides the default name. If not supplied the name of the link will equal the plural value of the model. |

---

## `console.navigation/section`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique identifier for this item. |
| `perspective` | `string` | yes | The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. |
| `dataAttributes` | `{ [key: string]: string; }` | yes | Adds data attributes to the DOM. |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here. For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. |
| `name` | `string` | yes | Name of this section. If not supplied, only a separator will be shown above the section. |

---

## `console.navigation/separator`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique identifier for this item. |
| `perspective` | `string` | yes | The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. |
| `section` | `string` | yes | Navigation section to which this item belongs to. If not specified, render this item as a top level link. |
| `dataAttributes` | `{ [key: string]: string; }` | yes | Adds data attributes to the DOM. |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here. For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. |

---

## `console.page/resource/details`

### Summary 

Adds new resource details page to Console router.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sGroupKindModel` | no | The model for which this resource page links to. |
| `component` | `CodeRef<React.ComponentType<{ match: match<{}>; namespace: string; model: ExtensionK8sModel; }>>` | no | The component to be rendered when the route matches. |

---

## `console.page/resource/list`

### Summary 

Adds new resource list page to Console router.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sGroupKindModel` | no | The model for which this resource page links to. |
| `component` | `CodeRef<React.ComponentType<{ match: match<{}>; namespace: string; model: ExtensionK8sModel; }>>` | no | The component to be rendered when the route matches. |

---

## `console.page/route`

### Summary 

Adds new page to Console router.<br/><br/>Under the hood we use React Router.<br/>See https://v5.reactrouter.com/

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `component` | `CodeRef<React.ComponentType<RouteComponentProps<{}, StaticContext, any>>>` | no | The component to be rendered when the route matches. |
| `path` | `string \| string[]` | no | Valid URL path or array of paths that `path-to-regexp@^1.7.0` understands. |
| `perspective` | `string` | yes | The perspective to which this page belongs to. If not specified, contributes to all perspectives. |
| `exact` | `boolean` | yes | When true, will only match if the path matches the `location.pathname` exactly. |

---

## `console.page/route/standalone`

### Summary 

Adds new standalone page (rendered outside the common page layout) to Console router.<br/><br/>Under the hood we use React Router.<br/>See https://v5.reactrouter.com/

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `component` | `CodeRef<React.ComponentType<RouteComponentProps<{}, StaticContext, any>>>` | no | The component to be rendered when the route matches. |
| `path` | `string \| string[]` | no | Valid URL path or array of paths that `path-to-regexp@^1.7.0` understands. |
| `exact` | `boolean` | yes | When true, will only match if the path matches the `location.pathname` exactly. |

---

## `console.perspective`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | The perspective identifier. |
| `name` | `string` | no | The perspective display name. |
| `icon` | `CodeRef<LazyComponent>` | no | The perspective display icon. |
| `landingPageURL` | `CodeRef<(flags: { [key: string]: boolean; }, isFirstVisit: boolean) => string>` | no | The function to get perspective landing page URL. |
| `importRedirectURL` | `CodeRef<(namespace: string) => string>` | no | The function to get redirect URL for import flow. |
| `default` | `boolean` | yes | Whether the perspective is the default. There can only be one default. |
| `defaultPins` | `ExtensionK8sModel[]` | yes | Default pinned resources on the nav |
| `usePerspectiveDetection` | `CodeRef<() => [boolean, boolean]>` | yes | The hook to detect default perspective |

---

## `console.project-overview/inventory-item`

### Summary 

Adds a new inventory item into project overview page.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `component` | `CodeRef<React.ComponentType<{ projectName: string; }>>` | no | The component to be rendered. |

---

## `console.project-overview/utilization-item`

### Summary 

Adds a new project overview utilization item.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `title` | `string` | no | The title of the utilization item. |
| `getUtilizationQuery` | `CodeRef<GetProjectQuery>` | no | Prometheus utilization query. |
| `humanize` | `CodeRef<Humanize>` | no | Convert prometheus data to human readable form. |
| `getTotalQuery` | `CodeRef<GetProjectQuery>` | yes | Prometheus total query. |
| `getRequestQuery` | `CodeRef<GetProjectQuery>` | yes | Prometheus request query. |
| `getLimitQuery` | `CodeRef<GetProjectQuery>` | yes | Prometheus limit query. |
| `TopConsumerPopover` | `CodeRef<React.ComponentType<TopConsumerPopoverProps>>` | yes | Shows Top consumer popover instead of plain value |

---

## `console.pvc/alert`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `alert` | `CodeRef<React.ComponentType<{ pvc: K8sResourceCommon; }>>` | no | The alert component. |

---

## `console.pvc/create-prop`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `label` | `string` | no | Label for the create prop action. |
| `path` | `string` | no | Path for the create prop action. |

---

## `console.pvc/delete`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `predicate` | `CodeRef<(pvc: K8sResourceCommon) => boolean>` | no | Predicate that tells whether to use the extension or not. |
| `onPVCKill` | `CodeRef<(pvc: K8sResourceCommon) => Promise<void>>` | no | Method for the PVC delete operation. |
| `alert` | `CodeRef<React.ComponentType<{ pvc: K8sResourceCommon; }>>` | no | Alert component to show additional information. |

---

## `console.pvc/status`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `priority` | `number` | no | Priority for the status component. Bigger value means higher priority. |
| `status` | `CodeRef<React.ComponentType<{ pvc: K8sResourceCommon; }>>` | no | The status component. |
| `predicate` | `CodeRef<(pvc: K8sResourceCommon) => boolean>` | no | Predicate that tells whether to render the status component or not. |

---

## `console.redux-reducer`

### Summary 

Adds new reducer to Console Redux store which operates on `plugins.<scope>` substate.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `scope` | `string` | no | The key to represent the reducer-managed substate within the Redux state object. |
| `reducer` | `CodeRef<Reducer<any, AnyAction>>` | no | The reducer function, operating on the reducer-managed substate. |

---

## `console.resource/create`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sModel` | no | The model for which this create resource page will be rendered. |
| `component` | `CodeRef<React.ComponentType<CreateResourceComponentProps>>` | no | The component to be rendered when the model matches |

---

## `console.storage-class/provisioner`

### Summary 

Adds a new storage class provisioner as an option during storage class creation.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `CSI` | `ProvisionerDetails` | yes |  |
| `OTHERS` | `ProvisionerDetails` | yes |  |

---

## `console.storage-provider`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `name` | `string` | no |  |
| `Component` | `CodeRef<React.ComponentType<Partial<RouteComponentProps<{}, StaticContext, any>>>>` | no |  |

---

## `console.tab/horizontalNav`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sKindVersionModel` | no | The model for which this provider show tab. |
| `page` | `{ name: string; href: string; }` | no | The page to be show in horizontal tab. It takes tab name as name and href of the tab |
| `component` | `CodeRef<React.ComponentType<PageComponentProps<K8sResourceCommon>>>` | no | The component to be rendered when the route matches. |

---

## `console.telemetry/listener`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `listener` | `CodeRef<TelemetryEventListener>` | no | Listen for telemetry events |

---

## `console.topology/adapter/build`

### Summary 

BuildAdapter contributes an adapter to adapt element to data that can be used by Build component

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `adapt` | `CodeRef<(element: GraphElement) => AdapterDataType<BuildConfigData> \| undefined>` | no |  |

---

## `console.topology/adapter/network`

### Summary 

NetworkAdpater contributes an adapter to adapt element to data that can be used by Networking component

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `adapt` | `CodeRef<(element: GraphElement) => NetworkAdapterType \| undefined>` | no |  |

---

## `console.topology/adapter/pod`

### Summary 

PodAdapter contributes an adapter to adapt element to data that can be used by Pod component

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `adapt` | `CodeRef<(element: GraphElement) => AdapterDataType<PodsAdapterDataType> \| undefined>` | no |  |

---

## `console.topology/component/factory`

### Summary 

Getter for a ViewComponentFactory

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `getFactory` | `CodeRef<ViewComponentFactory>` | no | Getter for a ViewComponentFactory |

---

## `console.topology/create/connector`

### Summary 

Getter for the create connector function

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `getCreateConnector` | `CodeRef<CreateConnectionGetter>` | no | Getter for the create connector function |

---

## `console.topology/data/factory`

### Summary 

Topology Data Model Factory Extension

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | Unique ID for the factory. |
| `priority` | `number` | no | Priority for the factory |
| `resources` | `WatchK8sResourcesGeneric` | yes | Resources to be fetched from useK8sWatchResources hook. |
| `workloadKeys` | `string[]` | yes | Keys in resources containing workloads. |
| `getDataModel` | `CodeRef<TopologyDataModelGetter>` | yes | Getter for the data model factory |
| `isResourceDepicted` | `CodeRef<TopologyDataModelDepicted>` | yes | Getter for function to determine if a resource is depicted by this model factory |
| `getDataModelReconciler` | `CodeRef<TopologyDataModelReconciler>` | yes | Getter for function to reconcile data model after all extensions' models have loaded |

---

## `console.topology/decorator/provider`

### Summary 

Topology Decorator Provider Extension

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no |  |
| `priority` | `number` | no |  |
| `quadrant` | `TopologyQuadrant` | no |  |
| `decorator` | `CodeRef<TopologyDecoratorGetter>` | no |  |

---

## `console.topology/details/resource-alert`

### Summary 

DetailsResourceAlert contributes an alert for specific topology context or graph element.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | The ID of this alert. Used to save state if the alert shouldn't be shown after dismissed. |
| `contentProvider` | `CodeRef<(element: GraphElement) => DetailsResourceAlertContent \| null>` | no | Hook to return the contents of the Alert. |

---

## `console.topology/details/resource-link`

### Summary 

DetailsResourceLink contributes a link for specific topology context or graph element.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `link` | `CodeRef<(element: GraphElement) => React.Component \| undefined>` | no | Return the resource link if provided, otherwise undefined.<br/>Use ResourceIcon and ResourceLink for styles. |
| `priority` | `number` | yes | A higher priority factory will get the first chance to create the link. |

---

## `console.topology/details/tab`

### Summary 

DetailsTab contributes a tab for the topology details panel.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique identifier for this details tab. |
| `label` | `string` | no | The tab label to display in the UI. |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here.<br/>For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here.<br/>For arrays, the first one found in order is used.<br/>insertBefore takes precedence. |

---

## `console.topology/details/tab-section`

### Summary 

DetailsTabSection contributes a section for a specific tab in topology details panel.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | A unique identifier for this details tab section. |
| `tab` | `string` | no | The parent tab ID that this section should contribute to. |
| `provider` | `CodeRef<DetailsTabSectionExtensionHook>` | no | A hook that returns a component or null/undefined that will be rendered<br/>in the topology sidebar.<br/>SDK component: <Section title={<optional>}>... padded area </Section> |
| `section` | `CodeRef<(element: GraphElement, renderNull?: () => null) => React.Component \| undefined>` | no | @deprecated Fallback if no provider is defined. renderNull is a no-op already. |
| `insertBefore` | `string \| string[]` | yes | Insert this item before the item referenced here.<br/>For arrays, the first one found in order is used. |
| `insertAfter` | `string \| string[]` | yes | Insert this item after the item referenced here.<br/>For arrays, the first one found in order is used.<br/>insertBefore takes precedence. |

---

## `console.topology/display/filters`

### Summary 

Topology Display Filters Extension

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `getTopologyFilters` | `CodeRef<() => TopologyDisplayOption[]>` | no |  |
| `applyDisplayOptions` | `CodeRef<TopologyApplyDisplayOptions>` | no |  |

---

## `console.topology/relationship/provider`

### Summary 

Topology relationship provider connector extension

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `provides` | `CodeRef<RelationshipProviderProvides>` | no |  |
| `tooltip` | `string` | no |  |
| `create` | `CodeRef<RelationshipProviderCreate>` | no |  |
| `priority` | `number` | no |  |

---

## `console.user-preference/group`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | ID used to identify the user preference group. |
| `label` | `string` | no | The label of the user preference group. |
| `insertBefore` | `string` | yes | ID of user preference group before which this group should be placed. |
| `insertAfter` | `string` | yes | ID of user preference group after which this group should be placed. |

---

## `console.user-preference/item`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | ID used to identify the user preference item and referenced in insertAfter and insertBefore to define the item order. |
| `groupId` | `string` | no | IDs used to identify the user preference groups the item would belong to. |
| `label` | `string` | no | The label of the user preference. |
| `description` | `string` | no | The description of the user preference. |
| `field` | `UserPreferenceField` | no | The input field options used to render the values to set the user preference. |
| `insertBefore` | `string` | yes | ID of user preference item before which this item should be placed. |
| `insertAfter` | `string` | yes | ID of user preference item after which this item should be placed. |

---

## `console.yaml-template`

### Summary 

YAML templates for editing resources via the yaml editor.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sModel` | no | Model associated with the template. |
| `template` | `CodeRef<string>` | no | The YAML template. |
| `name` | `string` | no | The name of the template. Use the name `default` to mark this as the default template. |

---

## `dev-console.add/action`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | ID used to identify the action. |
| `label` | `string` | no | The label of the action |
| `description` | `string` | no | The description of the action. |
| `groupId` | `string` | yes | IDs used to identify the action groups the action would belong to. |
| `href` | `string` | yes | The href to navigate to. |
| `callback` | `CodeRef<(props: Record<string, any>) => void>` | yes | A callback that performs an action on click |
| `icon` | `CodeRef<React.ReactNode>` | yes | The perspective display icon. |
| `accessReview` | `AccessReviewResourceAttributes[]` | yes | Optional access review to control visibility / enablement of the action. |

---

## `dev-console.add/action-group`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `id` | `string` | no | ID used to identify the action group. |
| `name` | `string` | no | The title of the action group |
| `insertBefore` | `string` | yes | ID of action group before which this group should be placed |
| `insertAfter` | `string` | yes | ID of action group after which this group should be placed |

---

## `dev-console.import/environment`

### Summary 

(not available)

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `imageStreamName` | `string` | no | Name of the image stream to provide custom environment variables for |
| `imageStreamTags` | `string[]` | no | List of supported image stream tags |
| `environments` | `ImageEnvironment[]` | no | List of environment variables |

---

## `console.dashboards/overview/detail/item`

### Summary [DEPRECATED]

@deprecated use CustomOverviewDetailItem type instead

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `component` | `CodeRef<React.ComponentType<{}>>` | no | The value, based on the DetailItem component |

---

## `console.page/resource/tab`

### Summary [DEPRECATED]

@deprecated - Use `console.tab/horizontalNav` instead<br/>Adds new resource tab page to Console router.

### Properties

| Name | Value Type | Optional | Description |
| ---- | ---------- | -------- | ----------- |
| `model` | `ExtensionK8sGroupKindModel` | no | The model for which this resource page links to. |
| `component` | `CodeRef<React.ComponentType<RouteComponentProps<{}, StaticContext, any>>>` | no | The component to be rendered when the route matches. |
| `name` | `string` | no | The name of the tab. |
| `href` | `string` | yes | The optional href for the tab link. If not provided, the first `path` is used. |
| `exact` | `boolean` | yes | When true, will only match if the path matches the `location.pathname` exactly. |

