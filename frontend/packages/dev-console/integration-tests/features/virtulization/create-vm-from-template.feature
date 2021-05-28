@cnv
Feature: Create Virtual Machines using Template from Developer perspective
              As a user, I should be able create Virtual Machines using Template from Developer perspective


        Background:
            Given user has installed OpenShift Virtualization Operator
              And user has created the OpenShift Virtualization Deployment
              And user has created the HostPathProvisioner Deployment
              And user has selected namespace "aut-virtualization"
              And user is at administrator perspective


        @smoke @to-do
        Scenario: Create Virtual Machine: VM-02-TC01
            Given user has created Virtual Machine Template
              And user is at Virtual Machines page
             When user clicks on "vmware-test-template" template card
              And user clicks on Create from template button
              And user enters name "fedora-test-vm" as virtual machine name
              And user clicks on Create Virtual Machine button
             Then user will be redirected to Topology page
              And And user will see virtual machine created
