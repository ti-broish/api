import { FirebaseUser } from 'src/firebase/auth'

declare global {
  namespace Express {
    interface Request {
      firebaseUser: FirebaseUser
      i18nLang: string
    }
  }
}
