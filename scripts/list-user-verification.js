import admin from 'firebase-admin'
import dotenv from 'dotenv'
import serviceAccount from '../firebase.json'

dotenv.config()
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ti-broish.firebaseio.com',
})
let hasErrors = false

const listAllUsers = async () => {
  return new Promise(async (resolve, reject) => {
    // List batch of users, 1000 at a time.
    const listBatchOfUsers = async (nextPageToken) => {
      await admin
        .auth()
        .listUsers(1000, nextPageToken)
        .then(async (listUsersResult) => {
          listUsersResult.users.forEach((userRecord) => {
            const { email, emailVerified } = userRecord.toJSON()
            console.log(email, emailVerified)
          })
          if (listUsersResult.pageToken) {
            // List next batch of users.
            await listBatchOfUsers(listUsersResult.pageToken)
          } else {
            resolve()
          }
        })
        .catch((error) => {
          console.log('Error listing users:', error)
          hasErrors = true
        })
    }
    await listBatchOfUsers()
  })
}

const runScript = async () => {
  try {
    // Start listing users from the beginning, 1000 at a time.
    await listAllUsers()
    process.exit(hasErrors ? 1 : 0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

runScript()
