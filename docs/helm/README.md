**List Helm Releases**
----
  _Returns List installed helm charts in JSON_

* **URL**

     `/api/helm/releases`

* **Method:**
  
  `GET` 
  
*  **URL Params**

   `ns=[string]` - Namespace

* **Success Response:**
  
  * **Code:** 200 <br />
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`


**Get Helm Release**
----
  _Returns installed helm release in JSON_

* **URL**

     `/api/helm/release`

* **Method:**
  
  `GET` 
  
*  **URL Params**
 
   `ns=[string]` - Namespace
   
   `name=[string]` - Helm Release Name

* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/master/pkg/release/release.go#L22)
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`



**Get Helm Release History**
----
  _Returns installed helm release history in JSON_

* **URL**

     `/api/helm/release/history`

* **Method:**
  
  `GET` 
  
*  **URL Params**
 
   `ns=[string]` - Namespace
   
   `name=[string]` - Helm Release Name

* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON encoded array of [Release structure](https://github.com/helm/helm/blob/master/pkg/release/release.go#L22)
 
* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

**Install Helm Release**
----
  _Install Helm release_

* **URL**

    `/api/helm/release`

* **Method:**
  
  `POST` 
  
*  **Post Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   values: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/master/pkg/release/release.go#L22)
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`


**Uninstall Helm Release**
----
  _Uninstall Helm release_

* **URL**

    `/api/helm/release`

* **Method:**
  
  `DELETE` 
  
*  **URL Params**
 
   `ns=[string]` - Namespace
   
   `name=[string]` - Helm Release Name

* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON encoded [UninstallReleaseResponse structure](https://github.com/helm/helm/blob/93137abbb4d391accd23dc774eb4d02a36d7a5f9/pkg/release/responses.go#L19)
  
  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`
 
* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`


**Upgrade Helm Release**
----
  _Upgrade Helm release_

* **URL**

    `/api/helm/release`

* **Method:**
  
  `PUT` 
  
*  **Put Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   values: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/master/pkg/release/release.go#L22)
 
* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

**Rollback Helm Release**
----
  _Rollback Helm release_

* **URL**

    `/api/helm/release`

* **Method:**
  
  `PATCH` 
  
*  **Put Data Params**

```
 {
   name: [string],
   namespace: [string]
   version: [int]
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
        "version": 1,
    }
```


* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/master/pkg/release/release.go#L22)
 
* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`
    
**Render Helm Template/Manifests**
----

  _Simulates helm template command_

* **URL**

    `/api/helm/template`

* **Method:**
  
  `POST` 
  
*  **Post Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   value: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**
  
  * **Code:** 200 <br />
 
* **Error Response:**

  * **Code:** 502 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`

**Retrieve a Chart**
----

_Returns all chart details for the given chart URL_

* **URL**

    `/api/helm/chart`

* **Method:**
  
  `GET` 

*  **URL Params**

   `url=[string]` - Chart URL

* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON representation of [Chart structure](https://github.com/helm/helm/blob/master/pkg/chart/chart.go#L31)
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`
