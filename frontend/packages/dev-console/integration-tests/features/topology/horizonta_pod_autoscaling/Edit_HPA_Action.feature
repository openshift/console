Feature: Edit HPA action
	As a user, I want to edit the HPA assigned to a workload
 
Background:
    Given user is in developer perspective
    And user has created a deployment 
    And user has added CPU resource limit
    And user has added Memory resource limit
    And user is in topology

@regression
Scenario: Edit HPA action form view
   Given user has a workload "<workload_name>" with HPA assigned to it
   When user opens sidebar of workload
   And user opens action menu
   And user clicks on Edit Horizontal Pod Autoscaler option 
   And user sees Edit Horizontal Pod Autoscaler form opens
   And user sees values are prefilled
   And user checks the name value but can not edit it
   And user checks and edit the value to "<hpa_max_pod>" for maximum pods
   And user checks and edit the value to "<hpa_min_pod>" for minimum pods
   And user checks and edit the cpu value to "<cpu_utilisation>"
   And user checks and edit the memory value to "<memory_utilization>"
   And user clicks on save to get back to topology page
   And user opens the sidebar
   And user selects on resource tab
   And user sees Horizontal Pod Autoscalers section
   And user goes to the details tab
   Then user can see the changed pods number

Examples:
|  workload_name  | hpa_max_pod | hpa_min_pod | cpu_utilisation | memory_utilization |
| nodejs-ex-git-1 |      6      |      3      |        75       |          50        |

@regression, @manual
Scenario: Edit HPA action YAML view
   Given user has a workload "<workload_name>" with HPA assigned to it
   When user opens sidebar of workload
   And user opens action menu
   And user clicks on Edit Horizontal Pod Autoscaler option 
   And user sees Edit Horizontal Pod Autoscaler page opens with form view selected
   And user selects YAML view option
   And user sees schema on the right sidebar
   And user scrolls and checks schema
   And user closes the schema
   And user checks the YAML
   And user checks and edits values of cpu under metrics.resource.target.averageUtilization to "<cpu_utilisation>"
   And user checks and edits values of memory under metrics.resource.target.averageUtilization to "<memory_utilization>"
   And user checks and edits minimum pods value to "<hpa_min_pod>" in minReplicas
   And user checks and edits maximum pods value to "<hpa_max_pod>" in maxReplicas
   And user checks the name value under metadata.name
   And user clicks on save to get back to topology page
   And user opens the sidebar
   And user selects on resource tab
   And user sees Horizontal Pod Autoscalers section
   And user goes to the details tab
   Then user can see the changed pods number

@regression, @manual
Scenario: Edit HPA YAML view to form view
   Given user has a workload "<workload_name>" with HPA assigned to it
   When user opens sidebar of workload
   And user opens action menu
   And user clicks on Edit Horizontal Pod Autoscaler option 
   And user sees Edit Horizontal Pod Autoscaler page opens with form view selected
   And user selects YAML view option
   And user sees the schema on the right sidebar
   And user checks the schema
   And user closes the schema window
   And user checks the YAML
   And user changes values of cpu under metrics.resource.target.averageUtilization with resource name as cpu to "<cpu_utilisation>"
   And user changes values of memory under metrics.resource.target.averageUtilization with resource name as memory to "<memory_utilization>"
   And user changes minimum pods value to "<hpa_min_pod>" in minReplicas
   And user changes maximum pods value to "<hpa_max_pod>" in maxReplicas
   And user switches to form view
   Then user checks the changed values in form view

@regression, @manual
Scenario: Edit HPA from Administrative perspective
   Given user has a workload "<workload_name>" with HPA named "<name_hpa>" assigned to it
   When user switches to administrative perspective
   And user goes to Workloads
   And user selects Horizontal Pod Autoscalers option 
   And user opens the HPA associated with the workload
   And user sees the HPA details page
   And user opens action menu
   And user clicks on Edit Horizontal Pod Autoscaler option 
   And user sees schema on the right sidebar
   And user closes the schema
   And user checks the spec.scaleTargetRef.name to be "<workload_name>"
   And user changes the metadata.name to "<new_name_hpa>"
   And user clicks on save
   And user sees error is thrown saying resource name cannot be changed
   And user restores the previous name value i.e. "<name_hpa>"
   And user edits the spec.minReplicas to "<min_hpa_pod>"
   And user edits the spec.maxReplicas to "<max_hpa_pod>"
   And user edits value for cpu to spec.metrics.resource.target.averageUtilization under cpu target as "<cpu_util>"
   And user edits value for memory to spec.metrics.resource.target.averageUtilization under memory target as "<memory_util>"
   And user sees save, reload and cancel button
   And user clicks on save 
   And user sees YAML gets updated with updation message
   And user clicks on details tab
   Then user can see Min Replicas and Max Replicas updated value
   And user can see Target value of resource memory and resource cpu to be the updated value

Examples:
|  workload_name  | name_hpa | new_name_hpa | max_hpa_pod | min_hpa_pod | cpu_util | memory_util |
| nodejs-ex-git-1 | test-hpa | new-test-hpa |      7      |      4      |    75    |      60     |
