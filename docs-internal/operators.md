# Update UI

The UI detects if operators are installed in the cluster and conditionally enables and renders the update UI feature in the `Cluster Settings` page.

## Operator feature detection

We determine if the feature is enabled by first checking if the operator feature exists. For more information, see [k8s/k8s.js](https://github.com/openshift/console/blob/master/frontend/public/module/k8s/k8s.js).

## UI Components

The update UI is divided into several key components and is abstracted such that additional channels could be added in the future e.g. Tectonic channel, Container Linux channel, etc.

All components live in [components/cluster-updates](https://github.com/openshift/console/blob/master/frontend/public/components/cluster-updates). Each major component has a description in the file of how it's intended to be used.

## Data flow

The UI reads data for the `tectonicversions`, `channeloperatorconfigs`, and `appversions` via a websocket. For tectonicversions and appversions, it parses the status and spec versions to determine the current state of the component and then passes the results to `ChannelOperator` to be displayed.

Data mutations, such as clicking the "check for update"/"start upgrade" button or changing a config field, are simple k8s patches to the appropriate config. When you click a button or submit a config form, the UI shows a pending/loading state until the corresponding websocket receives new data. When new data is received, the mutation is considered "applied" and the UI displays the data, however it does not validate if the intended value was actually applied.

At no point does interaction with the UI mutate the incoming data. If a mutation is made, the UI waits for that data to come in through the firehose.

## Local Testing

Refer to "Local Testing" in the [monitoring doc](./monitoring.md#local-testing).
