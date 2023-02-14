/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')
const dotenv = require('dotenv')
const fetch = require('node-fetch')

const envConfig = dotenv.parse(fs.readFileSync('./.env'))

const serviceAccount = require(path.join(
  '..',
  envConfig.GOOGLE_APPLICATION_CREDENTIALS,
))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

admin
  .auth()
  .createCustomToken(envConfig.FIREBASE_UID, {})
  .then((token) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${envConfig.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          token,
          returnSecureToken: true,
        }),
      },
    )
  })
  .then((result) => result.json())
  .then(({ idToken }) => {
    console.log(idToken)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error creating id token: ', error)
    process.exit(1)
  })
