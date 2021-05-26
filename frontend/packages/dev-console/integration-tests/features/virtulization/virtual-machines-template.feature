@cnv
Feature: Create Virtual Machine templates
              As a user, I should be able create virutal machine template to create virtual machine


        Background:
            Given user has installed OpenShift Virtualization Operator
              And user has created the OpenShift Virtualization Deployment
              And user has created the HostPathProvisioner Deployment
              And user is at administrator perspective
              And user has selected namespace "aut-virtualization"
        


        @smoke, @regression
        Scenario: Create Virutal Machine template: VM-04-TC01
            Given user is at Virtualization tab under Workloads nav-item
             When user clicks on Templates tab
              And user clicks on Create drop down
              And user clicks on With Wizard under Template section
              And user enters name "vmware-test-template"
              And user selects "Fedora 31 or higher" from Operating System dropdown
              And user selects "Import via Registry (creates PVC)" from Boot Source dropdown
              And user enters "kubevirt/fedora-cloud-container-disk-demo" in Container Image field
              And user selects "Small - 1 vCPU, 2 GiB Memory" from Flavor dropdown
              And user selects "Desktop" from Workload Type dropdown
              And user clicks on Review and Confirm button
              And user clicks on Create Virtual Machine template
             Then user will see "Successfully created virtual machine template" message
              And user will see See virtual machine template details button
