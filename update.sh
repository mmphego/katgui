echo "## Updating mkatgui code from git ..."
git remote update -p
git merge --ff-only master

echo "## Updating bower and gulp ..."
sudo -H npm update -g bower gulp

echo "## Installing bower components ..."
bower install

echo "## Installing nodejs components ..."
npm install

echo "## Performing gulp build ..."
gulp build

echo "## Compressing dist/ folder ..."
VERSION=`kat-get-version.py`
FILENAME="katgui-$VERSION.tar.gz"
TIMESTAMP=`date +%s`
echo "{\"version\":\"$VERSION\",\"buildDate\":\"$TIMESTAMP""000\"}" > dist/version.txt
tar -zcvf $FILENAME dist/
echo "## KATGUI compressed to $FILENAME"
