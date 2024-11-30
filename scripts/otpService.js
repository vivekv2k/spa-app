/*import { firestore,auth} from '@/firebaseConfig';*/
import auth from '@react-native-firebase/auth';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber,PhoneAuthProvider } from 'firebase/auth';
/*
export const sendPhoneVerification = async (phoneNumber) => {
    try {
        const confirmation = await auth().verifyPhoneNumber(phoneNumber);
        return confirmation.verificationId;
    } catch (error) {
        console.error('Error sending phone verification:', error);
        throw error;
    }
};*/
export const sendPhoneVerification = async (phoneNumber) => {
    const confirmation = await auth().verifyPhoneNumber(phoneNumber);
    console.log(confirmation);
 //   try {
     /*   const auth = getAuth();
        const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
            size: 'invisible',
            callback: (response) => {
                // reCAPTCHA solved
            }
        }, auth);

        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return confirmation.verificationId;*/
 //   } catch (error) {
    //    console.error('Error sending phone verification:', error);
     //   throw error;
  //  }
};


// Helper function to verify phone number
const verifyPhoneNumber = (auth, credential) => {
    return new Promise((resolve, reject) => {
        auth.signInWithCredential(credential)
            .then((result) => {
                // Phone number verified successfully
                auth.currentUser.delete(); // Delete the temporary user
                resolve();
            })
            .catch((error) => {
                // Phone number verification failed
                reject(error);
            });
    });
};