@knative
Feature: Create a workload of 'knative Service' type resource
              As a user, I want to create workload from Add Flow page

        Background:
            Given user has created or selected namespace "aut-knative-workload"


        @regression
        Scenario: knative resource type in container image add flow: KN-05-TC01
            Given user is at Add page
             When user clicks on Container Image card
             Then user will be redirected to page with header name "Deploy Image"
              And Knative Service option is displayed under Resources section


        @regression
        Scenario: knative resource type in docker file add flow: KN-05-TC02
            Given user is at Add page
             When user clicks on From Dockerfile card
             Then user will be redirected to page with header name "Import from Dockerfile"
              And Knative Service option is displayed under Resources section


        @regression
        Scenario: knative resource type in catalog add flow: KN-05-TC03
            Given user is at Add page
             When user clicks on From Catalog card
              And create the application with s2i builder image
             Then user will be redirected to page with header name "Create Source-to-Image Application"
              And Knative Service option is displayed under Resources section


        @smoke
        Scenario Outline: Create knative workload from From Git card on Add page: KN-05-TC04
            Given user is at Import from git page
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<workload_name>"
              And user selects resource type as "Knative"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page

        Examples:
                  | git_url                                 | workload_name |
                  | https://github.com/sclorg/nodejs-ex.git | knative-git   |


        @regression
        Scenario Outline: Create knative workload using Container image with extrenal registry on Add page: KN-05-TC05
            Given user is at Deploy Image page
             When user enters Image name from external registry as "<image_name>"
              And user enters workload name as "<workload_name>"
              And user selects resource type as "Knative Service"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page

        Examples:
                  | image_name                | workload_name       |
                  | openshift/hello-openshift | knative-ex-registry |


        @regression
        Scenario Outline: Create a workload from Docker file card on Add page: KN-05-TC06
            Given user is on Import from Docker file page
             When user enters Docker url as "<docker_git_url>"
              And user enters workload name as "<workload_name>"
              And user selects resource type as "Knative Service"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page

        Examples:
                  | docker_git_url                          | workload_name  |
                  | https://github.com/sclorg/nodejs-ex.git | knative-docker |


        @regression
        Scenario: Create a workload from DevCatalog BuilderImages card on Add page: KN-05-TC07
            Given user is at Developer Catalog page
              And builder images are displayed
             When user searches and selects the "node" card
              And user creates the application with the selected builder image
              And user enters S2I Git Repo url as "https://github.com/sclorg/nodejs-ex.git"
              And user enters workload name as "knative-dev-catalog"
              And user selects resource type as "Knative Service"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "nodejs-ex-git" in topology page


        @regression
        Scenario: Create a knative workload with advanced option "Scaling" from From Git card: KN-05-TC08
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
             Then user will see value of autoscaling.knative.dev/maxScale, autoscaling.knative.dev/minScale, autoscaling.knative.dev/target, autoscaling.knative.dev/targetUtilizationPercentage, autoscaling.knative.dev/window under annotation and containerConcurrency under spec as under spec 5, 1, 3, 70, 9s and 15 respectively


        @regression @manual
        Scenario: knative resource type in upload JAR file: KN-05-TC09
            Given user is at the Add page
             When user clicks on the Upload JAR file card
              And user drag and drop the file in JAR file section
              And user selects appropriate Build image version
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user selects resource type as "knative"
              And user clicks on Create
             Then user will be redirected to Topology page
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see knative service "sample-yaml-upload" in application "sample-upload-app" is created in topology
