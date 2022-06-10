import firebase from 'firebase/compat/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
}

const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY
// const firebaseApp = firebase.initializeApp(firebaseConfig)
// const messaging = getMessaging(firebaseApp)
const messaging: any = undefined

export const fetchToken = () => {
  return getToken(messaging, {
    vapidKey,
  })
    .then(currentToken => {
      if (currentToken) {
        return currentToken
        // Track the token -> client mapping, by sending to backend server
        // show on the UI that permission is secured
      } else {
        return ''
        // shows on the UI that permission is required
      }
    })
    .catch(err => {
      console.log(err)
      // catch error while creating client token
      return ''
    })
}

export const onMessageListener = () =>
  new Promise(resolve => {
    onMessage(messaging, payload => {
      resolve(payload)
    })
  })
