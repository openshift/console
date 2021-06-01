@pipelines
Feature: Create Pipeline from Add Options
              As a user, I want to create, edit, delete and view the pipeline

        Background:
            Given user has created or selected namespace "aut-pipelines-add-options"


        @regression
        Scenario: Pipelines section on git form: P-01-TC01
             When user clicks From Git card on the Add page
             Then user will be redirected to Import from Git form
              And pipeline section is displayed with message "Select a Builder Image and resource to see if there is a pipeline template available for this runtime."


        @smoke
        Scenario Outline: Create a pipeline from git workload with resource type "<resource>": P-01-TC02
            Given user is at Import from Git form
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<pipeline_name>" in General section
              And user selects resource type as "<resource>"
              And user selects Add Pipeline checkbox in Pipelines section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<pipeline_name>" in topology page

        Examples:
                  | git_url                                 | pipeline_name | resource          |
                  | https://github.com/sclorg/nodejs-ex.git | nodejs-f      | Deployment        |
                  | https://github.com/sclorg/nodejs-ex.git | nodejs-fc     | Deployment Config |


        @regression
        Scenario Outline: Create a pipeline from git workload with knative resource type: P-01-TC03
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-pipelines-add-options"
              And user is at Add page
              And user is at Import from Git form
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<pipeline_name>" in General section
              And user selects resource type as "knative"
              And user selects Add Pipeline checkbox in Pipelines section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<pipeline_name>" in topology page

        Examples:
                  | git_url                                 | pipeline_name    |
                  | https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git-kn |


        @smoke
        Scenario Outline: Pipeline in topology page: P-01-TC04
            Given user created workload "<name>" from add page with pipeline
              And user is at the Topology page
              And workload "<name>" is added to namespace
             When user searches for "<name>" in topology page
              And user clicks node "<name>" in topology page
             Then pipeline name "<name>" is displayed in topology side bar
              And side bar is displayed with the pipelines section

        Examples:
                  | name       |
                  | nodejs-top |


        @smoke
        Scenario Outline: Search the created pipeline from Add options in pipelines page: P-01-TC05
            Given user created workload "<name>" from add page with pipeline
              And user is at pipelines page
             When user searches for pipeline "<name>" in pipelines page
             Then pipeline "<name>" is displayed in pipelines page

        Examples:
                  | name     |
                  | nodejs-g |


        @regression
        Scenario Outline: Create a workload with pipeline from Docker file: P-01-TC06
            Given user is on Import from Docker file page
             When user enters Git Repo url in docker file as "<docker_git_url>"
              And user enters Name as "<pipeline_name>" in General section of Dockerfile page
              And user selects Add Pipeline checkbox in Pipelines section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<pipeline_name>" in topology page

        Examples:
                  | docker_git_url                         | pipeline_name   |
                  | https://github.com/sclorg/nginx-ex.git | docker-pipeline |


        @regression
        Scenario Outline: Create a pipeline with s2i builder images: P-01-TC07
            Given user is at Developer Catalog form with builder images
             When user searches builder image "node" in developer catalog
              And user creates the application with the selected builder image
              And user enters Git Repo url in builder image as "<git_url>"
              And user selects Add Pipeline checkbox in Pipelines section
              And user clicks Create button on Create Source-to-Image application
             Then user will be redirected to Topology page
              And user is able to see workload "<name>" in topology page

        Examples:
                  | git_url                                 | name          |
                  | https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git |


        #Marking this as manual due to git rate limit  issue
        @manual
        Scenario Outline: Add Pipeline display in git workload for builder image: P-01-TC08
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
