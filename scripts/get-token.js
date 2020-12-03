const fs = require('fs');
const dotenv = require('dotenv');
const FirebaseTokenGetter = require('firebase-idtoken-getter');
const config = require('../firebase.json')

dotenv.config();
const envConfig = dotenv.parse(fs.readFileSync('./.env'))
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = envConfig['GOOGLE_APPLICATION_CREDENTIALS']

const FirebaseTokenGetterObject = new FirebaseTokenGetter(
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  process.argv[2] ?? process.env.FIREBASE_UID,
  process.env.FIREBASE_API_KEY,
  process.env.GOOGLE_CLOUD_PROJECT,
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

