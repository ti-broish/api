const admin = require('firebase-admin');
const firebase = require('firebase');
const serviceAccount = require('../firebase.json');

require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
});

const adminAuth = admin.auth();
const auth = firebase.auth();

const emailUser = async (email) => {
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    const token = await adminAuth.createCustomToken(userRecord.uid);
    await auth.signInWithCustomToken(token);
    const currentUser = auth.currentUser;
    await currentUser.sendEmailVerification();
    console.log('email sent to', email);
    await auth.signOut();
    process.exit(0);
  } catch (error) {
    console.log('Error: ', error);
    process.exit(1);
  }
};

emailUser(process.argv[2]);
