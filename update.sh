echo "## Updating mkatgui code from git ..."
git remote update -p
git merge --ff-only origin/master

echo "## Installing npm packages ..."
yarn install

echo "## Performing gulp build ..."
gulp build
