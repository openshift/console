Feature: Perform actions on HPA in Topology page
              As a user, I want to add HPA to a workload


        Background:
            Given user has created or selected namespace "topology-hpa"


        @regression
        Scenario Outline: Add HorizontalPodAutoscaler to deployment workload: TH-02-TC01
            Given user has created a deployment workload "nodejs-ex-git" with CPU resource limit "100" and Memory resource limit "100"
              And user is at Topology page
             When user clicks on workload "nodejs-ex-git"
              And user selects "Add HorizontalPodAutoscaler" option from Actions menu
              And user enters Name as "<hpa_name>" in Horizontal Pod Autoscaler page
              And user sets Minimum Pods value to "<hpa_min_pod>"
              And user sets Maximum Pods value to "<hpa_max_pod>"
              And user enters CPU Utilization as "<cpu_utilisation>"
              And user enters Memory Utilization as "<memory_utilization>"
              And user clicks on Save button
              And user clicks on workload "nodejs-ex-git"
              And user selects Resources tab on sidebar
             Then user can see two pods under pod section
              And user can see HorizontalPodAutoscalers section
              And user can see the "<hpa_name>" with HPA tag associated present under HPA section

        Examples:
                  | hpa_name | hpa_min_pod | hpa_max_pod | cpu_utilisation | memory_utilization |
                  | test-hpa | 2           | 5           | 60              | 30                 |


        @regression
        Scenario Outline: Edit HorizontalPodAutoscaler: TH-02-TC02
            Given user has a workload "<workload_name>" with HPA assigned to it
              And user is at Topology page
             When user clicks on workload "nodejs-ex-git"
              And user selects "Edit HorizontalPodAutoscaler" option from Actions menu
              And user sees values are prefilled
              And user checks the name value but cannot edit it
              And user checks and edit the value to "<hpa_max_pod>" for maximum pods
              And user checks and edit the value to "<hpa_min_pod>" for minimum pods
              And user checks and edit the cpu value to "<cpu_utilisation>"
              And user checks and edit the memory value to "<memory_utilization>"
              And user clicks on Save button
              And user clicks on workload "nodejs-ex-git"
              And user selects Resources tab on sidebar
              And user sees Horizontal Pod Autoscalers section
              And user goes to the details tab
             Then user can see the changed pods number

        Examples:
                  | workload_name   | hpa_max_pod | hpa_min_pod | cpu_utilisation | memory_utilization |
                  | nodejs-ex-git-1 | 6           | 3           | 75              | 50                 |


        @regression
        Scenario: Remove HorizontalPodAutoscaler: TH-02-TC03
            Given user has a deployment workload "nodejs-ex-git-1" with HPA assigned to it
              And user is at Topology page
             When user right clicks on workload "nodejs-ex-git-1"
              And user selects "Remove HorizontalPodAutoscaler" option from context menu
              And user clicks Remove on "Remove HorizontalPodAutoscaler?" modal
              And user clicks on workload "nodejs-ex-git-1"
              And user selects Resources tab on sidebar
             Then user can not see HorizontalPodAutoscalers section


        @regression, @manual
        Scenario: Add HPA from YAML view: TH-02-TC04
             When user clicks on workload "nodejs-ex-git"
              And user selects "Add HorizontalPodAutoscaler" option from Actions menu
              And user navigates to YAML view in Horizontal Pod Autoscaler page
              And user sees schema on the right sidebar
              And user scrolls and checks schema
              And user closes the schema
              And user checks the YAML
              And user assigns name value as "<hpa_name>"
              And user gives value to averageUtilization under cpu target as "<cpu_utilisation>"
              And user clicks on Save button
              And user clicks on workload "nodejs-ex-git"
              And user selects Resources tab on sidebar
             Then user can see Horizontal Pod Autoscalers section
              And user can see the "<hpa_name>" with HPA tag associated present under HPA section


        @regression, @manual
        Scenario: Edit HPA action YAML view: TH-02-TC05
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
        Scenario: Edit HPA YAML view to form view: TH-02-TC06
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
