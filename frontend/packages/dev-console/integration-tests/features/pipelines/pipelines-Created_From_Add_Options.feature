Feature: Create Pipeline from Add Options
    As a user, I want to view pipeline, create, edit and delete the pipeline

Background:
    Given user has installed OpenShift Pipelines operator
    And user has selected namespace "aut-pipelines-add-options"
    And user is at Add page


@regression
Scenario: From Git Page pipelines section: P-01-TC03
   Given user is at Add page
   When user clicks From Git card on the Add page
   Then user will be redirected to Import from Git form
   And pipeline section is displayed with message "Select a builder image and resource to see if there is a pipeline template available for this runtime."


@regression
Scenario: From Dockerfile Page Pipelines section : P-01-TC04
   Given user is at Add page
   When user clicks From Dockerfile card on the Add page
   Then user will be redirected to Import from Dockerfile form
   And Add pipeline section is displayed


@regression
Scenario Outline: Add Pipeline display in git workload for builder image : P-02-TC08
   Given user is at Import from Git form
   When user enters Git Repo url as "<git_url>"
   Then Add pipeline checkbox is displayed

Examples:
| git_url                                                   |
| https://github.com/sclorg/dancer-ex.git                   |
| https://github.com/sclorg/cakephp-ex.git                  |
| https://github.com/sclorg/nginx-ex.git                    |
| https://github.com/sclorg/httpd-ex.git                    |
| https://github.com/redhat-developer/s2i-dotnetcore-ex.git |
| https://github.com/sclorg/golang-ex.git                   |
| https://github.com/sclorg/ruby-ex.git                     |
| https://github.com/sclorg/django-ex.git                   |
| https://github.com/jboss-openshift/openshift-quickstarts  |
| https://github.com/sclorg/nodejs-ex.git                   |


@regression, @smoke
Scenario Outline: Create a pipeline from git workload with resource type "<resource>" : P-02-TC01, P-02-TC06
   Given user is at Import from Git form
   When user enters Git Repo url as "<git_url>"
   And user enters Name as "<pipeline_name>" in General section
   And user selects resource type as "<resource>"
   And user selects Add Pipeline checkbox in Pipelines section
   And user clicks Create button on Add page
   Then user will be redirected to Topology page
   And user is able to see workload "<pipeline_name>" in topology page

Examples:
| git_url                                 | pipeline_name    | resource          |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git-f  | Deployment        |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git-fc | Deployment Config |


@regression
Scenario Outline: Create a pipeline from git workload with knative resource type  : P-02-TC07
   Given user has installed OpenShift Serverless Operator
   And user is at Import from Git form
   When user enters Git Repo url as "<git_url>"
   And user enters Name as "<name>" in General section
   And user selects resource type as "knative"
   And user selects Add Pipeline checkbox in Pipelines section
   And user clicks Create button on Add page
   Then user will be redirected to Topology page
   And user is able to see workload "<pipeline_name>" in topology page

Examples:
| git_url                                 | pipeline_name    | workload_name    |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex.git-Kn | nodejs-ex.git-Kn |


@regression, @smoke
Scenario Outline: Pipeline in topology page : P-02-TC02
   Given workload "<name>" is created from add page with pipeline 
   And user is at the Topolgy page
   And "<name>" component is added to namespace
   When user searches for "<name>" in topology page
   And user clicks node "<name>" in topology page
   Then side bar is displayed with pipeline name same as component name "<name>"

Examples:
| name            |
| nodejs-ex-git-f |


@regression, @smoke
Scenario Outline: Search the created pipeline from Add options in pipelines page : P-02-TC03
   Given workload "<name>" is created from add page with pipeline
   And user is at pipelines page
   When the user enters "<name>" into the search bar in pipelines page
   Then pipeline name is displayed with the component name "<name>"

Examples:
| name            |
| nodejs-ex-git-g |


@regression
Scenario Outline: Create a workload with pipeline from Docker file : P-02-TC04
   Given user is on Import from Docker file page
   When user enters Git Repo url as "<docker_git_url>" 
   And user selects Add Pipeline checkbox in Pipelines section
   And user clicks Create button on Add page   
   Then user will be redirected to Topology page
   And user is able to see workload "<pipeline_name>" in topology page

Examples:
| docker_git_url                         | name          |
| https://github.com/sclorg/nginx-ex.git | nginx-ex-git  |


Scenario Outline: Create a pipeline with s2i builder images : P-02-TC05
   Given user is at Developer Catalog form with builder images
   When user enters "node" into the Builder Image search bar
   And user creates the application with the selected builder image
   And user enters Git Repo url as "<git_url>" 
   And user selects Add Pipeline checkbox in Pipelines section
   And user clicks Create button on Create Source-to-Image application
   Then user will be redirected to Topology page
   And user is able to see workload "<name>" in topology page
   
Examples:
| git_url                                 | name          |
| https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git |


@regression
Scenario Outline: Pipelines section in topology page: P-02-TC09
   Given user is at the Topolgy page
   # When the user enters "<node_name>" into the search bar
   # And user clicks node on topology page
   # Then right side bar opens in topology page
   # And pipelines section is displayed
   # And "Start LastRun" button is disabled

Examples:
| node_name       | 
| nodejs-ex-D-git |
