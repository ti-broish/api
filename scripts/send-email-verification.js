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

const emailUser = async (email) => {
  try {
    const userRecord = await adminAuth().getUserByEmail(email)
    const token = await adminAuth().createCustomToken(userRecord.uid)
    const userCredential = await signInWithCustomToken(getAuth(), token)
    await userCredential.user.sendEmailVerification()
    console.log('email sent to', email)
    await getAuth().signOut()
    process.exit(0)
  } catch (error) {
    console.log('Error: ', error)
    process.exit(1)
  }
}

emailUser(process.argv[2])
