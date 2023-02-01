import admin from 'firebase-admin'
import dotenv from 'dotenv'
import serviceAccount from '../firebase.json'

dotenv.config()
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ti-broish.firebaseio.com',
})

function deleteUsers() {
  return new Promise((resolve, reject) => {
    admin
      .auth()
      .deleteUsers(process.argv[2].explode(','))
      .then(resolve)
      .catch(reject)
  })
}

async function runScript() {
  try {
    // Start listing users from the beginning, 1000 at a time.
    const deleteUsersResult = await deleteUsers()

    console.log(`Successfully deleted ${deleteUsersResult.successCount} users`)
    console.warn(`Failed to delete ${deleteUsersResult.failureCount} users`)
    deleteUsersResult.errors.forEach((err) => {
      console.error(err.error.toJSON())
    })
    process.exit(deleteUsersResult.failureCount > 0 ? 2 : 0)
  } catch (error) {
    console.error('Error deleting users:')
    console.error(error)
    process.exit(1)
  }
}

runScript()
