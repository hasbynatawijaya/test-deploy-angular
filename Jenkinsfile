// Jenkinsfile (Minimal SSH Test)
pipeline {
    agent any

    environment {
        VM_IP = "192.168.56.11" // Your VM's IP address
        VM_USER = "vagrant"     // Your VM's SSH user
        VM_SSH_CREDENTIAL_ID = "vm-ssh-key" // The ID of your SSH credentials in Jenkins
    }

    stages {
        stage('Test SSH Connection') {
            steps {
                script {
                    echo "--- DEBUGGING SSH CONNECTION START ---"
                    echo "VM_IP: '${env.VM_IP}'"
                    echo "VM_USER: '${env.VM_USER}'"
                    echo "VM_SSH_CREDENTIAL_ID: '${env.VM_SSH_CREDENTIAL_ID}'"

                    // Sanity check: Ensure the credential ID is not empty
                    if (env.VM_SSH_CREDENTIAL_ID == null || env.VM_SSH_CREDENTIAL_ID.trim().isEmpty()) {
                        error "VM_SSH_CREDENTIAL_ID is null or empty. Please check Jenkinsfile environment variables."
                    }

                    def remote = [:]
                    remote.name = env.VM_IP // A name for the remote host
                    remote.host = env.VM_IP
                    remote.user = env.VM_USER
                    remote.allowAnyHosts = true // Set to true to bypass known_hosts check for simplicity

                    try {
                        // This block binds the SSH private key from Jenkins credentials to a temporary file
                        withCredentials([sshUserPrivateKey(credentialsId: env.VM_SSH_CREDENTIAL_ID, keyFileVariable: 'identityFile', usernameVariable: 'userName')]) {
                            echo "Inside withCredentials block."
                            echo "identityFile (from binding): '${identityFile}'" // CRITICAL DEBUG OUTPUT
                            echo "userName (from binding): '${userName}'" // Should be 'vagrant'

                            // Sanity check: Ensure identityFile is populated by withCredentials
                            if (identityFile == null || identityFile.trim().isEmpty()) {
                                error "identityFile is null or empty AFTER withCredentials. Credential binding failed. Check credential ID and private key content."
                            }

                            // Assign the resolved variables to the remote map
                            remote.identityFile = identityFile
                            remote.user = userName

                            echo "Attempting simple SSH command to ${remote.host} as ${remote.user} using identity file: ${remote.identityFile}"

                            // Execute a very simple command to test the core SSH connection
                            // Using triple single quotes (''') for the command string to avoid Groovy interpolation issues
                            def result = sshCommand remote: remote, command: '''echo "Hello from VM! SSH connection successful. User: $(whoami) Current Dir: $(pwd)"'''
                            echo "SSH Command Output: ${result}"
                            echo "SSH connection test succeeded!"
                        }
                    } catch (Exception e) {
                        echo "ERROR: SSH connection test failed: ${e.getMessage()}"
                        echo "Full stack trace (check Jenkins console for more details):"
                        e.printStackTrace() // Print stack trace to console
                        currentBuild.result = 'FAILURE' // Explicitly fail the build
                        throw e // Re-throw to propagate the failure
                    }
                    echo "--- DEBUGGING SSH CONNECTION END ---"
                }
            }
        }
    }
}