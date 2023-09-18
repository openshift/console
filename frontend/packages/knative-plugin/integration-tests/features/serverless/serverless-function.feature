@knative-serverless @knative
Feature: Creation and Visualisation of serverless fuctions
              As a user, I want to create and verify a serverless function from Add Options and I should be able to differentiate between a plain Knative Service and a Serverless Function when looking at the Details page of the KSVC and the details tab of the side panel in Topology.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-serverless-function"

        @regression @manual
        Scenario: Visualize serverless function in topology chart view: SF-01-TC01
            Given user has created serverless function "nodetest"
              And user is at Topology list page
             When user clicks on Topology chart view
             Then user will see name of the serverless function as fx label followed by KSVC label and name "nodetest"
              And user will not see git and build decorator associated with the function


        @regression @manual
        Scenario: Visualize serverless function in topology list view: SF-01-TC02
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on Topology list view
             Then user will see name of the serverless function as KSVC label followed by fx label and name "nodetest"


        @regression @manual
        Scenario: Sidebar of serverless function: SF-01-TC03
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on "nodetest"
             Then user will see type as "Functions" mentioned in the Details tab of sidebar
              And user will see Labels as boson.dev/function=true and boson.dev/runtime=node


        @regression @manual
        Scenario: Service details page of serverless function: SF-01-TC04
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on "nodetest"
              And user clicks on heading "nodetest" in the sidebar
             Then user will see type as "Functions" mentioned in the Details tab of Service details page of "nodetest"
              And user will see Labels as boson.dev/function=true and boson.dev/runtime=node in Details tab

        @regression @odc-7167
        Scenario Outline: Create Serverless Function from Import From Git Form on Add page with Builder Images: SF-01-TC05
            Given user is at Add page
              And user is at Import from Git form
             When user enters Git Repo URL as "<git_url>"
              And user enters Name as "<workload_name>"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user clicks on Topology list view
              And user will see name of the serverless function as KSVC label followed by fx label and name "<workload_name>"

        Examples:
                  | git_url                                             | workload_name        |
                  | https://github.com/Lucifergene/serverless-func-repo | serverless-func-repo |

        @regression @odc-7167
        Scenario Outline: Create serverless function using Create Serverless function form with Builder Images: SF-01-TC06
            Given user is at Add page
             When user clicks on Create Serverless function card
              And user enters git url "<git_url>"
              And user is able to see builder image version dropdown
              And user is able to see the runtime details
              And user clicks on Create button on Create Serverless function
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page
              And user clicks on the Knative Service workload "<workload_name>"
              And user switches to the "Details" tab
              And user is able to see Type as Function



        Examples:
                  | git_url                                           | workload_name       |
                  | https://github.com/vikram-raj/hello-func-node-env | hello-func-node-env |

        @regression @odc-6360
        Scenario Outline: Create Serverless Function from the Import from Git Form on Add page with Pipeline: SF-01-TC07
            Given user has installed OpenShift Pipelines Operator
           # Below manual creation of the Piepline and ClusterTasks can be removed when Serverless new version 1.28 is released
              And user has created or selected namespace "aut-serverless-function"
              And user created Serverless Function node Pipeline
              And user is at Add page
              And user is at Import from Git form
             When user enters Git Repo URL as "<git_url>"
              And user enters Name as "<workload_name>"
              And user selects Add Pipeline checkbox in Pipelines section
              And user clicks Create button on Add page
             Then user is able to see workload "<workload_name>" in topology page
              And user clicks on the Knative Service workload "<workload_name>"
              And user switches to the "Details" tab
              And user is able to see Type as Function
              And user is able to see PipelineRuns in the "Resources" tab

        Examples:
                  | git_url                                       | workload_name                        |
                  | https://github.com/vikram-raj/hello-func-node | import-form-hello-func-node-pipeline |

        @regression @odc-6360
        Scenario Outline: Create serverless function using Create Serverless function form with Pipeline: SF-01-TC08
            Given user is at Add page
             When user clicks on Create Serverless function card
              And user enters git url "<git_url>"
              And user is able to see builder image version dropdown
              And user is able to see the runtime details
              And user enters Name as "<workload_name>"
              And user selects Add Pipeline checkbox in Pipelines section
              And user clicks on Create button on Create Serverless function
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page
              And user clicks on the Knative Service workload "<workload_name>"
              And user switches to the "Details" tab
              And user is able to see Type as Function
              And user is able to see PipelineRuns in the "Resources" tab

        Examples:
                  | git_url                                       | workload_name                                            |
                  | https://github.com/vikram-raj/hello-func-node | create-serverless-function-form-hello-func-node-pipeline |

        @regression @odc-6360
        Scenario Outline: Pipeline section should not present in Create Serverless function form if Pipeline is not available: SF-01-TC09
              And user is at Add page
             When user clicks on Create Serverless function card
              And user enters git url "<git_url>"
              And user enters Name as "<workload_name>"
             Then user is not able to see Add Pipeline checkbox

        Examples:
                  | git_url                                          | workload_name      |
                  | https://github.com/vikram-raj/hello-func-quarkus | hello-func-quarkus |


        @regression @odc-7275
        Scenario Outline: Test Serverless Functions: SF-01-TC10
            Given user is at Add page
             When user clicks on Create Serverless function card
              And user enters git url "<git_url>"
              And user clicks on Create button on Create Serverless function
              And user sees workload "<workload_name>" along with a revision in topology page
              And user clicks on the Knative Service workload "<workload_name>"
              And user selects option "Test Serverless Function" from Actions menu
              And user sees the Test Serverless Function modal
              And user selects "<invoke_format>" from the Format drop down field
              And user clicks on the "Advanced Settings" option
              And user enters the "demo.fn" in the Type field
              And user enters the "/demo/fn" in the Source field
              And user clicks on Add optional headers and enter "Auth" under Name and "true" under Value
              And user pastes the "request-body" code in "<invoke_format>" in the editor
              And user clicks the "Test" Button
             Then user is able to see a Success Alert
              And user is able to see the Response Body as "response-body" code for the "<invoke_format>" format
              And user clicks the "Close" Button

        Examples:
                  | git_url                                                                 | workload_name                  | invoke_format |
                  | https://github.com/openshift-dev-console/kn-func-typescript-http        | kn-func-typescript-http        | HTTP          |
                  | https://github.com/openshift-dev-console/kn-func-typescript-cloudevents | kn-func-typescript-cloudevents | CloudEvent    |


        @regression @odc-7316
        Scenario: Create serverless form extensions cards: SF-01-TC11
            Given user is at Add page
             When user clicks on Create Serverless function card
             Then user will be able to see VSCode extension card
              And user will be able to see IntelliJ extension card
