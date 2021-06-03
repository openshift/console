@service-mesh
Feature: Admin user created Service Mesh Control Plane to get the Kiali dashboard link on the Topology filterbar
              As an Admin user I want to launch Kiali from the Topology graph


        Background:
            Given user has logged in as kubeadmin
              # And user has installed Red Hat OpenShift Jaeger Operator
              # And user has installed Kiali Operator provided by Red Hat
              # And user has installed Red Hat OpenShift Service Mesh Operator
              # And user has created new project "istio-system"
              # And user has created Istio Service Mesh Control Plane instance in "istio-system" namespace
              And user is at Administrator perspective
              And user has verified that Kiali has been deployed in Service Mesh Control Plane in "istio-system" namespace
              And user has created a user with self-provisioner and view roles


        @smoke @regression
        Scenario: Open on Kiali link Project Details Overview Page: SM-01-TC01
            Given user is on the "istio-system" Projects page
             When user selects the "istio-system" project that recently created Open Shift Service Mesh Control Plane
             Then user will see the Service Mesh Enabled inside Details card
              And user will see Open on Kiali link inside Launcher card
              And user clicks on Kiali Link inside Launcher Card


        @regression
        Scenario: Open on Kiali link Project Details Page: SM-01-TC02
            Given user is on the "istio-system" Projects page
             When user selects "istio-system" project that recently created Open Shift Service Mesh Control Plane
              And user clicks on the Details page
             Then user will see the Service Mesh Enabled
              And user will see the Launcher section
              And user will see Kiali link inside Launcher section
              And user clicks on Kiali Link inside Launcher section


        @regression
        Scenario: Kiali link in the Topology filterbar: SM-01-TC03
            Given user is at Developer perspective
              And user is on the "istio-system" Projects page
             When user clicks on the Topology page
              And user selects project that recently created Open Shift Service Mesh Control Plane
             Then user will see Kiali link in the Topology filterbar
              And user clicks on Kiali Link in the Topology filterbar


        @regression
        Scenario: Kiali link on the Kiali node in the Topology: SM-01-TC04
            Given user is at Developer perspective
              And user is on the "istio-system" Projects page
             When user clicks on the Topology page
              And user selects project that recently created Open Shift Service Mesh Control Plane
             Then user will see Kiali node in the Topology
              And user clicks on Kiali Open URL Link in the Kiali node
