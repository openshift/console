// This is copied from https://github.com/coreos-inc/tectonic-stats-collector/tree/ab5c1d4f2cc36cea32b366ec65bdfd21642f70be/pkg/generator
package generator

import (
	kapi "k8s.io/kubernetes/pkg/api"
	kclient "k8s.io/kubernetes/pkg/client/unversioned"
)

type nodeLister interface {
	List() ([]node, error)
}

type node struct {
	Status nodeStatus `json:"status"`
}

type nodeStatus struct {
	Capacity map[string]string `json:"capacity"`
	NodeInfo nodeInfo          `json:"nodeInfo"`
}

type nodeInfo struct {
	OSImage                 string `json:"osImage"`
	KernelVersion           string `json:"kernelVersion"`
	ContainerRuntimeVersion string `json:"containerRuntimeVersion"`
	KubeletVersion          string `json:"kubeletVersion"`
}

func nodeFromKubernetesAPINode(kn kapi.Node) node {
	n := node{
		Status: nodeStatus{
			Capacity: make(map[string]string),
			NodeInfo: nodeInfo{
				OSImage:                 kn.Status.NodeInfo.OSImage,
				KernelVersion:           kn.Status.NodeInfo.KernelVersion,
				ContainerRuntimeVersion: kn.Status.NodeInfo.ContainerRuntimeVersion,
				KubeletVersion:          kn.Status.NodeInfo.KubeletVersion,
			},
		},
	}
	for k, v := range kn.Status.Capacity {
		n.Status.Capacity[string(k)] = v.String()
	}
	return n
}

type kubernetesClientWrapper struct {
	client *kclient.Client
}

func (k *kubernetesClientWrapper) List() ([]node, error) {
	knl, err := k.client.Nodes().List(kapi.ListOptions{})
	if err != nil {
		return nil, err
	}
	nodes := make([]node, len(knl.Items))
	for i, kn := range knl.Items {
		nodes[i] = nodeFromKubernetesAPINode(kn)
	}
	return nodes, nil
}
