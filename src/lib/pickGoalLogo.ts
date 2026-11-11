import { launchImageLibrary } from 'react-native-image-picker';
import { parseGoalLogo } from './goalLogo';

export async function pickGoalLogo() {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    assetRepresentationMode: 'compatible',
    includeBase64: true,
    maxWidth: 160,
    maxHeight: 160,
    quality: 0.7,
  });
  if (result.didCancel) return null;
  if (result.errorCode) throw new Error('The photo could not be opened.');

  const asset = result.assets?.[0];
  const logo = parseGoalLogo(
    asset?.type === 'image/jpg' ? 'image/jpeg' : asset?.type,
    asset?.base64,
  );
  if (!logo) throw new Error('Choose a JPEG or PNG logo under 128 KB.');
  return logo;
}
