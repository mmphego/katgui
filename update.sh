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
GIT_REF=`git rev-parse --short HEAD`
VERSION=`python -m json.tool dist/version.txt | grep -Po '\d\.\d\.\d'`
DATE=`date +"%Y-%m-%d"`
TIME=`date +"%H:%M"`
FILENAME="katgui-$VERSION-$DATET$TTIME-$GIT_REF.tar.gz"
tar -zcvf $FILENAME dist/
echo "## KATGUI compressed to $FILENAME"
