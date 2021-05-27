@topology
Feature: Perform actions on HPA in Administrative perspective
              As a user, I want to edit the HPA assigned to a workload


        Background:
            Given user has created or selected namespace "topology-hpa"
              And user has created a deployment workload "nodejs-ex-git" with CPU resource limit "100" and Memory resource limit "100"
              And user is at administrator perspective


        @regression @manual
        Scenario Outline: Add HPA from Administrative perspective: TH-01-TC01
            Given user is at HorizontalPodAutoscaler page under workloads section
             When user clicks Create HorizontalPodAutoscaler button
              And user sees Create Horizontal Pod Autoscaler in YAML view
              And user sees schema on the right sidebar
              And user scrolls and checks schema
              And user closes the schema
              And user changes the metadata.name to "<hpa_name>"
              And user changes the spec.scaleTargetRef.name to "<workload_name>"
              And user changes the spec.minReplicas to "<min_hpa_pod>"
              And user changes the spec.maxReplicas to "<max_hpa_pod>"
              And user changes value to spec.metrics.resource.target.averageUtilization under cpu target as "<cpu_util>"
              And user adds new field for memory similar to cpu under spec.metrics as resource.name with value memory
              And user adds value for memory to spec.metrics.resource.target.averageUtilization under memory target as "<memory_util>"
              And user sees save, reload and cancel button
              And user clicks on Save button
              And user checks details with Action menu on top
              And user sees Edit Labels, Edit Annotaions, Edit Horizontal Pod Autoscaler, Delete Horizontal Pod Autoscaler options in action menu
              And user checks details, YAML and Events tabs
              And user switches to developer perspective
              And user opens the sidebar of the "<workload_name>"
              And user selects on resource tab
             Then user can see Horizontal Pod Autoscalers section
              And user can see the "<hpa_name>" with HPA tag associated present under HPA section

        Examples:
                  | workload_name   | hpa_name | max_hpa_pod | min_hpa_pod | cpu_util | memory_util |
                  | nodejs-ex-git-1 | test-hpa | 5           | 2           | 60       | 30          |


        @regression @manual
        Scenario Outline: Edit HPA from Administrative perspective: TH-01-TC02
            Given user is at HorizontalPodAutoscaler page under workloads section
              And user has created HorizontalPodAutoscaler
             When user clicks the HPA associated with the workload
              And user selects "Edit HorizontalPodAutoscaler" option from Actions menu in HPA details page
              And user sees schema on the right sidebar
              And user closes the schema
              And user checks the spec.scaleTargetRef.name to be "<workload_name>"
              And user changes the metadata.name to "<new_name_hpa>"
              And user clicks on Save button
              And user sees error is thrown saying resource name cannot be changed
              And user restores the previous name value i.e. "<hpa_name>"
              And user edits the spec.minReplicas to "<min_hpa_pod>"
              And user edits the spec.maxReplicas to "<max_hpa_pod>"
              And user edits value for cpu to spec.metrics.resource.target.averageUtilization under cpu target as "<cpu_util>"
              And user edits value for memory to spec.metrics.resource.target.averageUtilization under memory target as "<memory_util>"
              And user sees save, reload and cancel button
              And user clicks on Save button
              And user sees YAML gets updated with updation message
              And user clicks on details tab
             Then user can see Min Replicas and Max Replicas updated value
              And user can see Target value of resource memory and resource cpu to be the updated value

        Examples:
                  | workload_name   | hpa_name | new_name_hpa | max_hpa_pod | min_hpa_pod | cpu_util | memory_util |
                  | nodejs-ex-git-1 | test-hpa | new-test-hpa | 7           | 4           | 75       | 60          |


        @regression @to-do
        Scenario: Delete HPA from Administrative perspective: TH-01-TC03
            Given user is at HorizontalPodAutoscaler page under workloads section
              And user has created HorizontalPodAutoscaler
             When user clicks the HPA associated with the workload
              And user selects "Delete HorizontalPodAutoscaler" option from Actions menu in HPA details page
              And user sees Delete Horizontal Pod Autoscaler modal opens
              And user clicks Delete
             Then user can see the intended HPA is deleted
