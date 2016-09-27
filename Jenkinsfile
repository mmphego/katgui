node('docker') {

    docker.image('camguinode:latest').inside('-u root') {
        stage 'Cleanup workspace'
            sh 'chmod 777 -R .'
            sh 'rm -rf *'

        stage 'Checkout SCM'
           checkout([
               $class: 'GitSCM',
               branches: [[name: "refs/heads/${env.BRANCH_NAME}"]],
               extensions: [[$class: 'LocalBranch']],
               userRemoteConfigs: scm.userRemoteConfigs,
               doGenerateSubmoduleConfigurations: false,
               submoduleCfg: []
           ])

        stage 'Install & Unit Tests'
            timeout(time: 30, unit: 'MINUTES') {
                sh './update.sh'
            }

        stage 'Build .whl & .deb'
            sh 'mv dist/ katgui'
            sh 'fpm -s "dir" -t "deb" --name katgui --version $(kat-get-version.py) --description "The operator interface for SKA-SA" katgui=/var/www'

        stage 'Archive build artifact .deb'
            archive '*.deb'

        stage 'Trigger downstream publish'
            build job: 'publish-local', parameters: [
                string(name: 'artifact_source', value: "${currentBuild.absoluteUrl}/artifact/dist/*zip*/dist.zip"),
                string(name: 'source_branch', value: "${env.BRANCH_NAME}")]
    }
}
