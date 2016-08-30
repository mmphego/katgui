node('docker') {
    stage 'Cleanup workspace'
    dir('katgui') {
        deleteDir()
    }
    sh 'rm -rf *.deb'

    docker.image('camguinode:latest').inside('-u root') {
        stage 'Checkout SCM'
            checkout([
                   $class: 'GitSCM',
                   branches: [[name: "${env.BRANCH_NAME}"]],
                   doGenerateSubmoduleConfigurations: false,
                   extensions: [[$class: 'LocalBranch', localBranch: "${env.BRANCH_NAME}"], [$class: 'PruneStaleBranch']],
                   submoduleCfg: [],
                   userRemoteConfigs: [[credentialsId: 'd725cdb1-3e38-42ca-9193-979c69452685', url: 'https://github.com/ska-sa/katgui.git']]
               ])

        stage 'Install & Unit Tests'
            timeout(time: 30, unit: 'MINUTES') {
                sh './update.sh'
            }

        stage 'Build .whl & .deb'
            sh 'mv dist/ katgui'
            sh 'fpm -s "dir" -t "deb" --name katgui --version $(kat-get-version.py) --description "The operator interface for SKA-SA" katgui=/var/www'
            // chmod for cleanup stage
            sh 'chmod 777 -R katgui *.deb'

        stage 'Archive build artifact: .whl & .deb'
            archive '*.deb'

        stage 'Trigger downstream publish'
            build job: 'publish-local', parameters: [
                string(name: 'artifact_source', value: "${currentBuild.absoluteUrl}/artifact/dist/*zip*/dist.zip"),
                string(name: 'source_branch', value: "${env.BRANCH_NAME}")]
    }
}
