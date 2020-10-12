pipeline {

    agent {
        label 'cambase_bionic'
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "refs/heads/${env.BRANCH_NAME}"]],
                    extensions: [[$class: 'LocalBranch']],
                    userRemoteConfigs: scm.userRemoteConfigs,
                    doGenerateSubmoduleConfigurations: false,
                    submoduleCfg: []
                ])
            }
        }

        stage('Install & Unit Tests') {
            options {
                timestamps()
                timeout(time: 30, unit: 'MINUTES')
            }

            steps {
                sh 'make jenkins-build'
            }
        }

        stage('Push dist to GitHub.') {
            when {
                not {
                    branch "master"
                }
            }
            steps {
                script {
                    sshagent(['katpulll_github_key']) {
                        sh """
                            su kat
                            git remote set-url --push origin git@github.com:ska-sa/katgui.git
                            git add dist
                            git commit -am'Automatted Jenkins commit: Push dist upstream.'
                            echo \$(whoami)
                            git push --set-upstream origin ${env.BRANCH_NAME}
                        """
                    }
                }
            }
        }
        stage('Build & publish packages') {
            when {
                branch 'master'
            }

            steps {
                sh 'mv dist/ katgui'
                sh 'fpm -s "dir" -t "deb" --name katgui --version $(kat-get-version.py) --description "The operator interface for SKA-SA" katgui=/var/www'
                archiveArtifacts '*.deb'

                // Trigger downstream publish job
                build job: 'ci.publish-artifacts', parameters: [
                        string(name: 'job_name', value: "${env.JOB_NAME}"),
                        string(name: 'build_number', value: "${env.BUILD_NUMBER}")]
            }
        }
    }
}
