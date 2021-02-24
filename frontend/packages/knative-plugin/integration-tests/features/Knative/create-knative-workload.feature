Feature: Create a workload of 'knative Service' type resource
              As a user, I want to create workload from Add Flow page

        Background:
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-create-knative-workload"


        @regression
        Scenario: knative resource type in container image add flow : Kn-01-TC04
            Given user is at Add page
             When user clicks on Container Image card
             Then user will be redirected to page with header name "Deploy Image"
              And Knative Service option is displayed under Resources section


        @regression
        Scenario: knative resource type in docker file add flow : Kn-01-TC05
            Given user is at Add page
             When user clicks on From Dockerfile card
             Then user will be redirected to page with header name "Import from Dockerfile"
              And Knative Service option is displayed under Resources section


        @regression
        Scenario: knative resource type in catalog add flow : Kn-01-TC06
            Given user is at Add page
             When user clicks on From Catalog card
              And create the application with s2i builder image
             Then user will be redirected to page with header name "Create Source-to-Image Application"
              And Knative Service option is displayed under Resources section


        @smoke
        Scenario Outline: Create knative workload from From Git card on Add page : Kn-02-TC01, Kn-01-TC03
            Given user is at Import from git page
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<workload_name>"
              And user selects resource type as "Knative"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page list view

        Examples:
                  | git_url                                 | workload_name |
                  | https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git |


        @regression
        Scenario Outline: Create knative workload using Container image with extrenal registry on Add page : Kn-02-TC02
            Given user is at Deploy Image page
             When user enters Image name from external registry as "<image_name>"
              And user enters workload name as "<workload_name>"
              And user selects "knative" resource type on Deploy Image page
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page list view

        Examples:
                  | image_name                | workload_name |
                  | openshift/hello-openshift | nodejs-ex-git |


        @regression
        Scenario Outline: Create a workload from Docker file card on Add page :Kn-02-TC03
            Given user is on Import from Docker file page
             When user enters Docker url as "<docker_git_url>"
              And user selects resource type as "Knative Service"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page list view

        Examples:
                  | form_name   | header_name             | docker_git_url                          | workload_name |
                  | Docker file | Import from Docker file | https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git |


        @regression
        Scenario: Create a workload from DevCatalog BuilderImages card on Add page : Kn-02-TC04
            Given user is at Developer Catalog page
              And builder images are displayed
             When user searches and selects the "node" card
              And user creates the application with the selected builder image
              And user enters S2I Git Repo url as "https://github.com/sclorg/nodejs-ex.git"
              And user selects resource type as "Knative Service"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "nodejs-ex-git" in topology page list view


        @regression
        Scenario: Create a knative workload with advanced option "Scaling" from From Git card
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "dancer-ex-git" in General section
              And user selects resource type as "Knative Service"
              And user clicks "Scaling" link in Advanced Options section
              And user enters number of Min Pods as "1"
              And user enters number of Max Pods as "5"
              And user enters number of Concurrency target as "3"
              And user enters number of Concurrency limit as "15"
              And user enters percentage of Concurrency utilization as "70"
              And user enters value of Autoscale window as "9 Sec"
              And user clicks Create button on Add page
              And user clicks on the Knative Service workload "dancer-ex-git"
              And user clicks on name KSVC "dancer-ex-git"
             Then user will see value of autoscaling.knative.dev/targetUtilizationPercentage and autoscaling.knative.dev/window as 70 and 9s respectively

