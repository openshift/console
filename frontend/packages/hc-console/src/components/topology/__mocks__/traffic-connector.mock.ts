/**
 * TODO(sahil143) remove this file we have api in place
 */
const data = {
  timestamp: 1579561864,
  duration: 21600,
  graphType: 'workload',
  elements: {
    nodes: [
      {
        data: {
          id: '5cd385c1ee3309ae40828b5702ae57fb',
          nodeType: 'workload',
          namespace: 'bookinfo',
          workload: 'details-v1',
          app: 'details',
          version: 'v1',
          destServices: [
            {
              namespace: 'bookinfo',
              name: 'details',
            },
          ],
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpIn: '0.04',
              },
            },
          ],
        },
      },
      {
        data: {
          id: '240c2314cefc993c5d9479a5c349fbd2',
          nodeType: 'workload',
          namespace: 'bookinfo',
          workload: 'productpage-v1',
          app: 'productpage',
          version: 'v1',
          destServices: [
            {
              namespace: 'bookinfo',
              name: 'productpage',
            },
          ],
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpIn: '0.04',
                httpOut: '0.08',
              },
            },
          ],
        },
      },
      {
        data: {
          id: '5fd49fef66081810598406b0686500ae',
          nodeType: 'workload',
          namespace: 'bookinfo',
          workload: 'ratings-v1',
          app: 'ratings',
          version: 'v1',
          destServices: [
            {
              namespace: 'bookinfo',
              name: 'ratings',
            },
          ],
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpIn: '0.03',
              },
            },
          ],
        },
      },
      {
        data: {
          id: 'fc3e7c5bb695ef8ed8ab2c5f6ac4725b',
          nodeType: 'workload',
          namespace: 'bookinfo',
          workload: 'reviews-v1',
          app: 'reviews',
          version: 'v1',
          destServices: [
            {
              namespace: 'bookinfo',
              name: 'reviews',
            },
          ],
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpIn: '0.01',
              },
            },
          ],
        },
      },
      {
        data: {
          id: '9e97011b2086f59a90626cfd5cf23fbf',
          nodeType: 'workload',
          namespace: 'bookinfo',
          workload: 'reviews-v2',
          app: 'reviews',
          version: 'v2',
          destServices: [
            {
              namespace: 'bookinfo',
              name: 'reviews',
            },
          ],
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpIn: '0.01',
                httpOut: '0.01',
              },
            },
          ],
        },
      },
      {
        data: {
          id: '731126638001dfa2b6cbeb3b326b6678',
          nodeType: 'workload',
          namespace: 'bookinfo',
          workload: 'reviews-v3',
          app: 'reviews',
          version: 'v3',
          destServices: [
            {
              namespace: 'bookinfo',
              name: 'reviews',
            },
          ],
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpIn: '0.01',
                httpOut: '0.01',
              },
            },
          ],
        },
      },
      {
        data: {
          id: 'e6016ec07f8f549a00b2d0182607347e',
          nodeType: 'workload',
          namespace: 't-s',
          workload: 'istio-ingressgateway',
          app: 'istio-ingressgateway',
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpOut: '0.04',
              },
            },
          ],
          isOutside: true,
          isRoot: true,
        },
      },
    ],
    edges: [
      {
        data: {
          id: 'df66cffc756bf9983dd453837e4e14a7',
          source: '240c2314cefc993c5d9479a5c349fbd2',
          target: '5cd385c1ee3309ae40828b5702ae57fb',
          traffic: {
            protocol: 'http',
            rates: {
              http: '0.04',
              httpPercentReq: '50.6',
            },
            responses: {
              '200': {
                '-': '100.0',
              },
            },
          },
        },
      },
      {
        data: {
          id: '1da31b81ccaf408abccbc57071458462',
          source: '240c2314cefc993c5d9479a5c349fbd2',
          target: '731126638001dfa2b6cbeb3b326b6678',
          traffic: {
            protocol: 'http',
            rates: {
              http: '0.01',
              httpPercentReq: '16.5',
            },
            responses: {
              '200': {
                '-': '100.0',
              },
            },
          },
        },
      },
      {
        data: {
          id: 'c2ab8814859ec0974c5efd597b5bb4fd',
          source: '240c2314cefc993c5d9479a5c349fbd2',
          target: '9e97011b2086f59a90626cfd5cf23fbf',
          traffic: {
            protocol: 'http',
            rates: {
              http: '0.01',
              httpPercentReq: '16.5',
            },
            responses: {
              '200': {
                '-': '100.0',
              },
            },
          },
        },
      },
      {
        data: {
          id: '943e5cc1b00d97a8a344fe1efd941130',
          source: '240c2314cefc993c5d9479a5c349fbd2',
          target: 'fc3e7c5bb695ef8ed8ab2c5f6ac4725b',
          traffic: {
            protocol: 'http',
            rates: {
              http: '0.01',
              httpPercentReq: '16.5',
            },
            responses: {
              '200': {
                '-': '100.0',
              },
            },
          },
        },
      },
      {
        data: {
          id: 'fa1db53921ef4a16b273c5260df63c2d',
          source: '731126638001dfa2b6cbeb3b326b6678',
          target: '5fd49fef66081810598406b0686500ae',
          traffic: {
            protocol: 'http',
            rates: {
              http: '0.01',
              httpPercentReq: '100.0',
            },
            responses: {
              '200': {
                '-': '100.0',
              },
            },
          },
        },
      },
      {
        data: {
          id: '0b356bd23faa1d1f26b3edeb4bbf0502',
          source: '9e97011b2086f59a90626cfd5cf23fbf',
          target: '5fd49fef66081810598406b0686500ae',
          traffic: {
            protocol: 'http',
            rates: {
              http: '0.01',
              httpPercentReq: '100.0',
            },
            responses: {
              '200': {
                '-': '100.0',
              },
            },
          },
        },
      },
      {
        data: {
          id: '454cd46a968f1d606a68498c741bb569',
          source: 'e6016ec07f8f549a00b2d0182607347e',
          target: '240c2314cefc993c5d9479a5c349fbd2',
          traffic: {
            protocol: 'http',
            rates: {
              http: '0.04',
              httpPercentReq: '100.0',
            },
            responses: {
              '200': {
                '-': '100.0',
              },
            },
          },
        },
      },
    ],
  },
};

export default data;
