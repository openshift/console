@pipelines
Feature: Create the pipeline from builder page
              As a user, I want to create the pipeline with different set of series & parallel tasks

        Background:
            Given user has created or selected namespace "aut-pipelines"


        @smoke
        Scenario: user navigates to pipelines page from Add page on selecting Pipeline card  : A-02-TC01
             When user selects "Pipeline" card from add page
             Then user redirects to Pipeline Builder page


        @regression
        Scenario: Pipeline Builder page: P-02-TC01
            Given user is at pipelines page
             When user clicks Create Pipeline button on Pipelines page
             Then user will be redirected to Pipeline Builder page
              And user is able to see pipeline name with default value "new-pipeline"
              And Tasks, Parameters, Resources and Workspaces sections are displayed
              And Yaml view configuration is displayed
              And Create button is in disabled state


        @regression @to-do
        Scenario Outline: Create a pipeline with series tasks: P-02-TC02
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user clicks on Add task
              And user searches "<cluster_task_name>" in quick search bar
              And user clicks on "Add" in "<cluster_task_name>" task
              And user adds another task "<cluster_task_name_1>" in series
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | cluster_task_name | cluster_task_name_1 |
                  | p-one         | kn                | openshift-client    |


        @regression @to-do
        Scenario Outline: Create a pipeline with parallel tasks: P-02-TC03
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user clicks on Add task
              And user searches "<cluster_task_name>" in quick search bar
              And user clicks on "Add" in "<cluster_task_name>" task
              And user adds another task "<cluster_task_name_1>" in parallel
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | cluster_task_name | cluster_task_name_1 |
                  | p-two         | kn                | openshift-client    |


        @smoke @to-do
        Scenario Outline: Create a basic pipeline from pipeline builder page: P-02-TC04
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user clicks on Add task
              And user searches "<cluster_task_name>" in quick search bar
              And user clicks on "Add" in "<cluster_task_name>" task
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | cluster_task_name |
                  | p-three-1     | kn                |


        @un-verified
        #test data required
        Scenario Outline: Create pipeline with "<resource_type>" as resource type from pipeline builder page: P-02-TC05
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user clicks on Add task
              And user searches "<cluster_task_name>" in quick search bar
              And user clicks on "Add" in "<cluster_task_name>" task
              And user adds "<resource_type>" resource with name "<resource_name>" to the "<cluster_task_name>"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
        #For git and image resource apply ../../testData/pipelines-workspaces/demo-optional-resources.yaml
                  | pipeline_name | cluster_task_name | resource_type | resource_name |
                  | p-git         | openshift-client  | Git           | git repo      |
                  | p-img         | buildah           | Image         | image repo    |
                  # | p-storage     | task-storage           | Storage       | storage repo  |
                  # | p-cluster     | task-cluster           | Cluster       | cluster repo  |


        @regression @to-do
        Scenario: Add Parameters to the pipeline in pipeline builder page: P-02-TC06
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-params"
              And user clicks on Add task
              And user searches "s2i-nodejs" in quick search bar
              And user clicks on "Add" in "s2i-nodejs" task
              And user adds the parameter details like Name, Description and Default Value
              And user clicks on Add workspace
              And user adds the Workspace name as "empty"
              And user adds the image name to the pipeline task "s2i-nodejs"
              And user adds the workspace "empty" to the pipeline task "s2i-nodejs"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-params"


        @regression @to-do
        Scenario: Deleting added task with delete icon in pipeline builder page: P-02-TC07
            Given user is at Pipeline Builder page
             When user clicks on Add task
              And user searches "kn" in quick search bar
              And user clicks on "Add" in "kn" task
              And user adds a task in series
              And user hovers over the newly added task
              And user clicks on delete icon
             Then user can see the task in series gets removed


        @regression @to-do
        Scenario Outline: Create a pipeline with TektonHub task not present in cluster from pipeline builder page: P-02-TC08
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user clicks on Add task
              And user searches and select "<task_name>" in the list of items based on the "tekton" provider in quick search bar
              And user clicks on "Install and Add" in "<task_name>" task
              And user should see the loading node until the installation is complete
              And user should see the Create button enabled after installation
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name |
                  | p-task-1      | kn        |


        @regression @to-do
        Scenario: Upgrade tasks that are already installed on the cluster in pipeline builder page: P-02-TC09
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-client"
              And user clicks on Add task
              And user searches "openshift-client" in quick search bar
              And user changes version to latest
              And user clicks on "Update and Add" button
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-client"


        @regression @to-do
        Scenario Outline: Create a pipeline with TektonHub task present in cluster from pipeline builder page: P-02-TC010
            Given user is at Pipeline Builder page
              And user has installed tekton hub "<task_name>" in cluster
             When user enters pipeline name as "<pipeline_name>"
              And user clicks on Add task
              And user searches and select "<task_name>" in the list of items based on the "tekton" provider in quick search bar
              And user clicks on "Add" in "<task_name>" task
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name |
                  | p-task-1      | kn        |


        @regression @manual
        Scenario: Create the pipeline from yaml editor: P-02-TC11
            Given user is at Pipeline Builder page
             When user selects YAML view
              And user clicks Create button on Pipeline Yaml page
             Then user will be redirected to Pipeline Details page with header name "new-pipeline"


        @regression
        Scenario: Create pipeline with Workspaces: P-02-TC12
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-workspace"
              And user clicks Add task button under Tasks section
              And user searches "git-clone" in quick search bar
              And user selects "git-clone" from git community
              And user clicks on Install and add button
              And user selects the "git-clone" node
              And user adds the git url in the url Parameter in cluster task sidebar
              And user clicks on Add workspace
              And user adds the Workspace name as "git"
              And user selects the "git-clone" node
              And user selects the "git" workspace in the Output of Workspaces in cluster task sidebar
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-workspace"
              And user will see workspace mentioned as "git" in the Workspaces section of Pipeline Details page


        @regression
        Scenario: Create pipeline with optional Workspaces: P-02-TC13
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipe-opt-workspace"
              And user clicks Add task button under Tasks section
              And user searches "git-clone" in quick search bar
              And user selects "git-clone" from git community
              And user clicks on Add button
              And user selects the "git-clone" node
              And user adds the git url in the url Parameter in cluster task sidebar
              And user clicks on Add workspace
              And user adds the Workspace name as "git-opt"
              And user clicks on Optional Workspace checkbox
              And user selects the "git-clone" node
              And user selects the "git-opt" workspace in the Output of Workspaces in cluster task sidebar
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipe-opt-workspace"
              And user will see workspace mentioned as "git-opt (optional)" in the Workspaces section of Pipeline Details page


        @regression @manual
        Scenario: Add finally task node: P-02-TC14
            Given user is at Pipeline Builder page
             When user clicks on Add finally task
              And user clicks on Add task
              And user searches "git-cli" in quick search bar
              And user clicks on Add in "git-cli" task
              And user clicks on Add finally task again
              And user clicks on Add task
              And user searches "git-clone" in quick search bar
              And user clicks on Add in "git-clone" task
             Then user sees Add finally task bubble is attached to the Select Task
              And user sees "git-cli" and "git-clone" tasks in parallel
              And user sees "Add finally task" option below "git-clone" task


        @regression @to-do
        Scenario: Create a pipeline with finally task node: P-02-TC15
            Given user is at Pipeline Builder page
             When user enters pipeline name "pipeline-finally"
              And user clicks on Add task
              And user searches "openshift-client-v0-22-0" in quick search bar
              And user clicks on Add in "openshift-client-v0-22-0" task
              And user clicks on Add finally task
              And user clicks on Add task
              And user searches "tkn" in quick search bar
              And user clicks on Add in "tkn" task
              And user clicks on Add finally task again
              And user selects "openshift-client" from Add task quick search
              And user clicks on Add finally task again
              And user selects "kn" from Add task quick search
              And user clicks on Create
             Then user will be redirected to Pipeline Details page with header name "pipeline-finally"
              And user is able to see finally tasks "tkn", "openshift-client" and "kn" mentioned under "Finally tasks" section in the Pipeline details page


        @regression
        Scenario: When expression in the Pipeline Builder: P-02-TC16
            Given user is at Pipeline Builder page
              And user has chain of 3 tasks created in series
            # user uses yaml content "sum-and-multiply-pipeline/sum-and-multiply-pipeline.yaml"
             When user clicks on third task
              And user navigates to When Expressions section
              And user clicks on Add When Expressions
             Then user can see a diamond shaped structure appear in front of third task
              And user can see "Input", "Operator" and "Value" fields in When Expressions section
              And user can see "Operator" has values "in" and "notin"
              And user can see "Add Value", "Add When Expressions" and "Remove When Expressions" options


        @regression
        Scenario: Start pipeline with When expression in the Pipeline Builder: P-02-TC17
            Given user is at Pipeline Builder page
              And user has named pipeline as "pipeline-when-expression"
              And user has tasks "tkn" and "kn" in series
              And user has a finally task as "openshift-client"
             When user clicks on finally task
              And user navigates to When Expressions section
              And user clicks on Add When Expression
              And user enters the input value as "$(tasks.tkn.status)"
              And user chooses the operator value "in" from the dropdown
              And user enters the value as "Success"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-when-expression"
              And user will see tooltip saying "When expression" while scrolling over diamond structure before conditional task


        @regression @to-do
        Scenario: Code assistance for referencing params in the Pipeline Builder: P-02-TC18
            Given user is at Pipeline Builder page
             When user clicks on Add task
              And user searches "git-clone" in quick search bar
              And user clicks on Add in "git-clone" task
              And user enters pipeline name as "pipeline-code-assistance"
              And user clicks on Add Parameter
              And user adds Name as "git-url"
              And user Default value as "https://github.com/sclorg/nodejs-ex.git"
              And user clicks on Add Workspace and add name as "git-workspace"
              And user clicks on "git-clone" task node
              And user enters url under Parameters section "$(params.git-url)"
              And user adds workspace as "git-workspace"
              And user clicks on Create
             Then user will be redirected to Pipeline Details page with header name "pipeline-code-assistance"


        @regression
        Scenario: Code assistance for referencing workspaces in the Pipeline Builder: P-02-TC19
            Given user has applied yaml "configMap-test-motd.yaml"
            # user uses yaml content "using-optional-workspaces-in-when-expressions-pipelineRun/configMap-test-motd.yaml" in editor
              And user is at YAML view
             When user pastes the "pipelineRun-using-optional-workspaces-in-when-expressions.yaml" code
            # user uses yaml content "using-optional-workspaces-in-when-expressions-pipelineRun/pipelineRun-using-optional-workspaces-in-when-expressions.yaml"
              And user clicks on Create button
              And user clicks on Logs tab in PipelineRun details page
             Then user will be able to see the output in print-motd task



        @regression
        Scenario: Code assistance for referencing Context-based values in the Pipeline Builder: P-02-TC20
            Given user is at pipelines page
             When user clicks on import YAML button
              And user enters yaml content from yaml file "pipelineRun-using_context_variables.yaml" in the editor
            # user uses yaml content "pipelineRun-using_context_variables.yaml"
              And user clicks on Create button
              And user clicks on Logs tab in PipelineRun details page
             Then user will be able to see the TaskRun UID, PipelineRun UID, Task name, TaskRun name, Pipeline name, PipelineRun name


        @regression
        Scenario: Code assistance for referencing Task Results in the Pipeline Builder: P-02-TC21
            Given user has imported YAML "task-sum.yaml" and "task-multiply.yaml"
            # user uses yaml content "sum-and-multiply-pipeline/task-sum.yaml" and "sum-and-multiply-pipeline/task-multiply.yaml" in editor
              And user is at YAML view of Pipeline Builder page
             When user enters the yaml content from yaml file "sum-and-multiply-pipeline.yaml"
            # user uses yaml content "sum-and-multiply-pipeline/sum-and-multiply-pipeline.yaml"
              And user clicks on Create
              And user clicks on import YAML button
              And user enters yaml content from yaml file "pipelineRun-sum-and-multiply-pipeline.yaml"
            # user uses yaml content "sum-and-multiply-pipeline/pipelineRun-sum-and-multiply-pipeline.yaml"
              And user clicks on Create button
              And user clicks on Logs tab in PipelineRun details page
             Then user will be able to see the output in sum and multiply task


        @regression @manual @odc-6377
        Scenario: Disable Tektonhub integration in the pipeline builder : P-02-TC22
            Given user is at Search page
              And user searches 'TektonConfig' in Resources dropdown
              And user selects config with apiVersion operator.openshift.io/v1 option from Resources dropdown
              And user clicks on "config" Name in TektonConfigs
              And user switches to YAML tab
              And user adds value of "spec.hub.params.value" as "false"
              And user clicks on Save button
              And user clicks on Pipeline tab in navigation menu
              And user clicks Create Pipeline button
              And user clicks on Add task
              And user types 'git'
             Then user will see Task, clusterTask only
