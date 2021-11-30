@add-flow @smoke
Feature: Create the different workloads from Add page
              As a user, I should be able to create an Application, component or service from one of the options provided on Add page


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "ci-addflow"
              And user is at Add page

        Scenario: Getting started resources on Developer perspective
             Then user will see Create Application using Samples, Build with guided documentation and Explore new developer features under Getting started resources section
              And user will see All services, Database, Operator Backed and Helm Chart options under Developer Catalog section
              And user will see Import from Git card under Git Repository section
              And user will see "Container images" option
              And user will see "Samples" option
              And user will see Import YAML, Upload JAR file under From Local Machine section

        @broken-test
        Scenario Outline: Deploy Application using Catalog Template "<template_type>": A-01-TC02
            Given user is at Developer Catalog page
              And user is at Templates page
             When user selects "<template_type>" from Templates type
              And user searches and selects Template card "<card_name>" from catalog page
              And user clicks Instantiate Template button on side bar
              And user clicks create button on Instantiate Template page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page

        Examples:
                  | template_type | card_name                             | workload_name             |
                  | CI/CD         | Jenkins                               | jenkins                   |
                  | Databases     | MariaDB                               | mariadb                   |
                  | Languages     | Node.js + PostgreSQL (Ephemeral)      | nodejs-postgresql-example |
                  | Middleware    | Apache HTTP Server                    | httpd-example             |
                  | Other         | Nginx HTTP server and a reverse proxy | nginx-example             |

        @broken-test
        Scenario Outline: Deploy <image> image with Runtime icon from external registry: A-02-TC02
            Given user is at Deploy Image page
             When user enters Image name from external registry as "<image_name>"
              And user selects the "<runtime_icon>" from Runtime Icon dropdown
              And user selects the application "sample-app" from Application dropdown
              And user enters Name as "<name>"
              And user selects resource type as "deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user will see the deployed image "<name>" with "<runtime_icon>" icon

        Examples:
                  | image  | image_name                | runtime_icon | name         |
                  | secure | openshift/hello-openshift | fedora       | hello-secure |

        @broken-test
        Scenario Outline: Deploy image with Runtime icon from internal registry: A-02-TC03
            Given user is at Deploy Image page
             When user selects Image stream tag from internal registry
              And user selects Project as "openshift" from internal registry
              And user selects Image Stream as "<image_stream>" from internal registry
              And user selects tag as "latest" from internal registry
              And user selects the "<runtime_icon>" from Runtime Icon dropdown
              And user selects the application "sample-app" from Application dropdown
              And user enters Name as "<name>"
              And user selects resource type as "deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user will see the deployed image "<name>" with "<runtime_icon>" icon

        Examples:
                  | image_stream | runtime_icon | name           |
                  | golang       | fedora       | hello-internal |

        @broken-test
        Scenario: Edit Runtime Icon while Editing Image: A-02-TC05
            Given user has deployed container Image "openshift/hello-openshift" from external registry
              And user is at Topology page
              And topology page has a deployed image "hello-openshift" with Runtime Icon "fedora"
             When user right clicks on the node "hello-openshift" to open context menu
              And user selects Edit imagename "hello-openshift" option
              And user updates the Runtime icon to "ansible"
              And user clicks on Save button
             Then user will be redirected to Topology page
              And user will see the deployment image "hello-openshift" icon updated to "ansible" Icon

        @broken-test
        Scenario: Create the Database from Add page: A-03-TC01
             When user clicks Database card
              And user selects "MariaDB" database on Developer Catalog
              And user clicks Instantiate Template button on side bar
              And user clicks create button on Instantiate Template page
             Then user will be redirected to Topology page
              And user is able to see workload "mariadb" in topology page

        @broken-test
        Scenario: Deploy git workload with devfile from topology page: A-04-TC01
            Given user is at the Topology page
             When user right clicks on topology empty graph
              And user selects "Import from Git" option from Add to Project context menu
              And user enters Git Repo URL as "https://github.com/redhat-developer/devfile-sample" in Import from Git form
              And user enters workload name as "node-bulletin-board-1"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "node-bulletin-board-1" in topology page

        @broken-test
        Scenario Outline: Create a workload from Docker file with "<resource_type>" as resource type: A-05-TC02
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
              And user enters Name as "<name>" in Docker file page
              And user selects "<resource_type>" radio button in Resource type section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<name>" in topology page

        Examples:
                  | resource_type | name       |
                  | Deployment    | dockerfile |

        @broken-test
        Scenario: Create a workload from YAML file: A-07-TC01
            Given user is at Import YAML page
             When user enters the "testData/add-flow/git-dc.yaml" file data to YAML Editor
              And user clicks create button on YAML page
              And user navigates to Topology page
             Then user is able to see workload "shell-app" in topology page
        @broken-test
        Scenario: Upload Jar file page details: A-10-TC01
            Given user is at Add page
             When user clicks on the Upload JAR file card
             Then user is able to see Upload jar file, Optional java commands, Run time Icon and Builder Image version fields displayed in JAR section
              And Application Name, Name fields displayed in General section
              And Resources section, Advanced options sections are displayed
              And Create button is in disabled state
