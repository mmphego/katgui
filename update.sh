echo "## Updating mkatgui code from git ..."
git remote update -p
git merge --ff-only origin/master

echo "## Updating bower and gulp ..."
sudo -H npm update -g bower gulp

echo "## Installing bower components ..."
bower install --allow-root

echo "## Installing nodejs components ..."
npm install

echo "## Performing gulp build ..."
gulp build
