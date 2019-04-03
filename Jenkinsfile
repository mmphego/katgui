pipeline {

    agent {
        label 'camguinode'
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
                sh './update.sh'
            }
        }

        stage('Build .deb') {
            steps {
                sh 'mv dist/ katgui'
                sh 'fpm -s "dir" -t "deb" --name katgui --version $(kat-get-version.py) --description "The operator interface for SKA-SA" katgui=/var/www'
            }
        }

        stage('Archive build artifact: .deb') {
            steps {
                archiveArtifacts '*.deb'
            }
        }

        stage('Trigger downstream publish') {
            steps {
                build(job: 'publish-local', parameters: [
                    string(name: 'artifact_source', value: "${currentBuild.absoluteUrl}/artifact/*zip*/archive.zip"),
                    string(name: 'source_branch', value: "${env.BRANCH_NAME}")])
            }
        }
    }
}
