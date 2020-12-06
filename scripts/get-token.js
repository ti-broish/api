const fs = require('fs');
const dotenv = require('dotenv');
const FirebaseTokenGetter = require('firebase-idtoken-getter');

const envConfig = dotenv.parse(fs.readFileSync('./.env'))

const FirebaseTokenGetterObject = new FirebaseTokenGetter(
  envConfig.GOOGLE_APPLICATION_CREDENTIALS,
  process.argv[2] ?? envConfig.FIREBASE_UID,
  envConfig.FIREBASE_API_KEY,
  envConfig.GOOGLE_CLOUD_PROJECT,
);

const getIdtoken = async () => {
  try {
    const token = await FirebaseTokenGetterObject.createIdTokenBycustomToken();
    console.log(token);
  } catch (error) {
    console.error(error)
    process.exit(1);
  }
}
getIdtoken();

