**List Helm Releases**
----
  _Returns List installed helm charts in JSON_

* **URL**

     `/api/helm/releases`

* **Method:**
  
  `GET` 
  
*  **URL Params**

   **Optional:**
 
   `ns=[string]` - Namespace

* **Success Response:**
  
  * **Code:** 200 <br />
 
* **Error Response:**

  * **Code:** 403 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`


**Get Helm Release**
----
  _Returns installed helm release in JSON_

* **URL**

     `/api/helm/release`

* **Method:**
  
  `GET` 
  
*  **URL Params**

   **Optional:**
 
   `ns=[string]` - Namespace
   
   `release_name=[string]` - Helm Release Name

* **Success Response:**
  
  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/master/pkg/release/release.go#L22)
 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
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
 
* **Error Response:**

  * **Code:** 403 BAD REQUEST <br />
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

  * **Code:** 403 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`
