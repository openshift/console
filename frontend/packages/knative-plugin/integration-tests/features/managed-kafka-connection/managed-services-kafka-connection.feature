@kafka, @odc-5175
Feature: Support for Managed Services
              As a user, I want to create the Kafka connection and support the manage services

        Background:
            Given user is at developer perspective
              And user has installed RHOAS operator
              And user has access to manage kafka cluster
              And user has created kafka instance and Topic in kafka cluster
              And user has created or selected namespace "aut-managed-services"


        @regression @manual
        Scenario: Create the Managed Services from Add page: KM-02-TC01
            Given user is at Add page
             When user clicks Managed Services card
              And user clicks "Red Hat OpenShift Application Services" card
              And user clicks on link "https://cloud.redhat.com/openshift/token"
              And user copies the API token from the link
              And user returns to console
              And user pastes the token in the API Token
              And user clicks on Connect button
              And user clicks on close buton
              And user clicks "Red Hat OpenShift Application Services" card again
              And user clicks on Connect button
              And user selects a Kafka Instance by clicking its radio button
              And user clicks on Next button
             Then user will be redirected to Topology page
              And user is able to see Kafka Connection in topology page


        @regression @manual
        Scenario: Create the Managed Services from Developer Catalog: KM-02-TC02
            Given user is at Add page
             When user clicks Developer Catalog card
              And user selects Type as Managed Services
              And user clicks "Red Hat OpenShift Application Services" card
              And user clicks on link "https://cloud.redhat.com/openshift/token"
              And user copies the API token from the link
              And user returns to console
              And user pastes the token in the API Token
              And user clicks on Connect button
              And user clicks on close buton
              And user clicks "Red Hat OpenShift Application Services" card again
              And user clicks on Connect button
              And user selects the Kafka Instance and clicks on Next button
             Then user will be redirected to Topology page
              And user is able to see Kafka Connection in topology page


        @regression
        Scenario: Empty Filter in Select Kafka Instance: KM-02-TC03
            Given user is at Kafka Instance page
             When user types "xys" in Search by name filter
             Then user will see "No Kafka instances found" message
              And user will see Clear filters option


        @regression
        Scenario: Sidebar of Kafka Connection instance: KM-02-TC04
            Given user has kafka instance
              And user has created Kafka Connection "kafka-instance-123" with the given kafka instance
              And user is at Topology page
             When user clicks on the Kafka Connection "kafka-instance-123"
              And user clicks on Details tab
             Then user will see the BootStrap Server and URL link present in the Details tab of the sidebar
              And user will see Secret in Resource tab of the sidebar


        @regression
        Scenario: Editing Kafka instances: KM-02-TC05
            Given user has two kafka instance user has added one kafka instances
              And user has created Kafka Connection "kafka-instance-123" with one kafka instance
              And user is at Add page
             When user clicks Managed Services card
              And user clicks "Red Hat OpenShift Application Services" card
              And user clicks on Connect button
              And user clicks on close buton
              And user clicks "Red Hat OpenShift Application Services" card again
              And user clicks on Connect button
             Then user will see the other available kafka instance in Select Kafka Instance page


        @regression @manual
        Scenario: Empty state of Select Kafka instances page: KM-02-TC06
            Given user has added all kafka instances
              And user is at Add page
             When user clicks Managed Services card
              And user clicks "Red Hat OpenShift Application Services" card
              And user clicks on link "https://cloud.redhat.com/openshift/token"
              And user copies the API token from the link
              And user returns to console
              And user pastes the token in the API Token
              And user clicks on Connect button
              And user clicks on close buton
              And user clicks "Red Hat OpenShift Application Services" card again
              And user clicks on Connect button
             Then user will see message "All available Kafka instances are connected to this project" in Select Kafka Instance page
              And user will see link "See Kafka instances in topology view" which redirects to Topology page

