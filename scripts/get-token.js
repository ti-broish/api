/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const {
  initializeApp: initializeAdminApp,
  cert,
} = require('firebase-admin/app')
const { getAuth: adminAuth } = require('firebase-admin/auth')
const { initializeApp } = require('firebase/app')
const { getAuth, signInWithCustomToken } = require('firebase/auth')
const { config } = require('dotenv')

config()

const serviceAccount = require(path.join(
  '..',
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
))

initializeAdminApp({ credential: cert(serviceAccount) })
initializeApp({
  projectId: serviceAccount.project_id,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${serviceAccount.project_id}.firebaseapp.com`,
})

async function printTokenForUser(firebaseUserUid) {
  try {
    const token = await adminAuth().createCustomToken(firebaseUserUid, {})
    const userCredential = await signInWithCustomToken(getAuth(), token)
    const decodedToken = await userCredential.user.getIdToken()
    console.log(decodedToken)
    process.exit(0)
  } catch (error) {
    console.error('Error creating id token: ', error)
    process.exit(1)
  }
}

void printTokenForUser(process.argv[2] || process.env.FIREBASE_UID)
