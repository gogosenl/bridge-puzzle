const path = require('path');
const Jimp = require('jimp-compact');

const root = path.join(__dirname, '..');
const sourcePath = path.join(root, 'assets', 'ui', 'logo.png');
const imagesPath = path.join(root, 'assets', 'images');

async function run() {
  const source = await Jimp.read(sourcePath);
  const icon = await Jimp.create(1024, 1024, Jimp.rgbaToInt(18, 28, 26, 255));
  const emblem = source.clone().contain(850, 850, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
  icon.composite(emblem, 87, 87);
  await icon.writeAsync(path.join(imagesPath, 'icon.png'));

  const foreground = await Jimp.create(1024, 1024, Jimp.rgbaToInt(0, 0, 0, 0));
  const foregroundEmblem = source.clone().contain(720, 720, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
  foreground.composite(foregroundEmblem, 152, 152);
  await foreground.writeAsync(path.join(imagesPath, 'android-icon-foreground.png'));

  await source.clone().contain(1024, 1024).writeAsync(path.join(imagesPath, 'splash-icon.png'));
  console.log('App icon, Android foreground, and splash logo created.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
