@pipelines
Feature: Create the pipeline from builder page
              As a user, I want to create the pipeline with different set of series & parallel tasks

        Background:
            Given user has created or selected namespace "aut-pipelines"


        @smoke
        Scenario: user navigates to pipelines page from Add page on selecting Pipeline card  : A-02-TC01
             When user selects "Pipeline" card from add page
             Then user redirects to Pipeline Builder page


        @regression @odc-3991
        Scenario: Pipeline Builder page: P-02-TC01
            Given user is at pipelines page
             When user clicks Create Pipeline button on Pipelines page
             Then user will be redirected to Pipeline Builder page
              And user is able to see pipeline name with default value "new-pipeline"
              And Tasks, Parameters, Resources and Workspaces sections are displayed
              And Yaml view configuration is displayed
              And Create button is in disabled state


        @regression
        Scenario Outline: Create a pipeline with series tasks: P-02-TC02
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds another task "<task_name_1>" in series
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name | task_name_1      |
                  | p-one         | kn        | openshift-client |


        @regression
        Scenario Outline: Create a pipeline with parallel tasks: P-02-TC03
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds another task "<task_name_1>" in parallel
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name | task_name_1      |
                  | p-two         | kn        | openshift-client |


        @smoke
        Scenario Outline: Create a basic pipeline from pipeline builder page: P-02-TC04
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name |
                  | p-three-1     | kn        |


        @un-verified
        #test data required
        Scenario Outline: Create pipeline with "<resource_type>" as resource type from pipeline builder page: P-02-TC05
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds "<resource_type>" resource with name "<resource_name>" to the "<task_name>"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
        #For git and image resource apply ../../testData/pipelines-workspaces/demo-optional-resources.yaml
                  | pipeline_name | task_name        | resource_type | resource_name |
                  | p-git         | openshift-client | Git           | git repo      |
                  | p-img         | buildah          | Image         | image repo    |
                  # | p-storage     | task-storage     | Storage       | storage repo  |
                  # | p-cluster     | task-cluster     | Cluster       | cluster repo  |


        @regression
        Scenario: Add Parameters to the pipeline in pipeline builder page: P-02-TC06
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-params"
              And user selects "s2i-nodejs" from Task drop down
              And user adds the parameter details like Name, Description and Default Value
              And user adds the image name to the pipeline task "s2i-nodejs"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-params"


        @regression @manual
        Scenario: Create the pipeline from yaml editor: P-02-TC07
            Given user is at Pipeline Builder page
             When user selects YAML view
              And user clicks Create button on Pipeline Yaml page
             Then user will be redirected to Pipeline Details page with header name "new-pipeline"


        @regression @odc-3991
        Scenario: Create pipeline with Workspaces: P-02-TC08
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-workspace"
              And user selects "git-clone" from Task drop down
              And user selects the "git-clone" node
              And user adds the git url in the url Parameter in cluster task sidebar
              And user clicks on Add workspace
              And user adds the Workspace name as "git"
              And user selects the "git-clone" node
              And user selects the "git" workspace in the Output of Workspaces in cluster task sidebar
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-workspace"
              And user will see workspace mentioned as "git" in the Workspaces section of Pipeline Details page


        @regression @odc-3991
        Scenario: Create pipeline with optional Workspaces: P-02-TC09
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipe-opt-workspace"
              And user selects "git-clone" from Task drop down
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
        Scenario: Add finally task node: P-02-TC10
            Given user is at Pipeline Builder page
             When user clicks on Add finally task
              And user clicks on Select task
              And user select "git-cli"
              And user clicks on Add finally task again
              And user clicks on Select task
              And user selects "git-clone"
             Then user sees Add finally task bubble is attached to the Select Task
              And user sees "git-cli" and "git-clone" tasks in parallel
              And user sees "Add finally task" option below "git-clone" task


        @regression @odc-5150
        Scenario: Create a pipeline with finally task node: P-02-TC11
            Given user is at Pipeline Builder page
             When user enters pipeline name "pipeline-finally"
              And user selects the first task as "openshift-client-v0-22-0"
              And user clicks on Add finally task
              And user selects the "tkn" task from finally task list
              And user clicks on Add finally task again
              And user selects "openshift-client" from finally task list
              And user clicks on Add finally task again
              And user selects "kn" from finally task list
              And user clicks on Create
             Then user will be redirected to Pipeline Details page with header name "pipeline-finally"
              And user is able to see finally tasks "tkn", "openshift-client" and "kn" mentioned under "Finally tasks" section in the Pipeline details page


        @regression @odc-5150
        Scenario: When expression in the Pipeline Builder: P-02-TC12
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


        @regression @odc-5150
        Scenario: Start pipeline with When expression in the Pipeline Builder: P-02-TC13
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


        @regression @odc-5150
        Scenario: Code assistance for referencing params in the Pipeline Builder: P-02-TC14
            Given user is at Pipeline Builder page
             When user selects "git-clone" from Select task list
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


        @regression @odc-5150
        Scenario: Code assistance for referencing workspaces in the Pipeline Builder: P-02-TC15
            Given user has applied yaml "configMap-test-motd.yaml"
            # user uses yaml content "using-optional-workspaces-in-when-expressions-pipelineRun/configMap-test-motd.yaml" in editor
              And user is at YAML view
             When user pastes the "pipelineRun-using-optional-workspaces-in-when-expressions.yaml" code
            # user uses yaml content "using-optional-workspaces-in-when-expressions-pipelineRun/pipelineRun-using-optional-workspaces-in-when-expressions.yaml"
              And user clicks on Create button
              And user clicks on Logs tab in PipelineRun details page
             Then user will be able to see the output in print-motd task



        @regression @odc-5150
        Scenario: Code assistance for referencing Context-based values in the Pipeline Builder: P-02-TC16
            Given user is at pipelines page
             When user clicks on import YAML button
              And user enters yaml content from yaml file "pipelineRun-using_context_variables.yaml" in the editor
            # user uses yaml content "pipelineRun-using_context_variables.yaml"
              And user clicks on Create button
              And user clicks on Logs tab in PipelineRun details page
             Then user will be able to see the TaskRun UID, PipelineRun UID, Task name, TaskRun name, Pipeline name, PipelineRun name


        @regression @odc-5150
        Scenario: Code assistance for referencing Task Results in the Pipeline Builder: P-02-TC17
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
             Then user will be able to see the output in sum and multipy task
