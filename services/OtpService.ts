import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {firestore} from '@/firebaseConfig';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import apiConfig from "@/config/apiConfig";

class OtpService {
    private accessToken: string | null = null;

    private async login() {

        try {
            const response = await fetch(`${apiConfig.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-VERSION': apiConfig.apiVersion,
                },

                body: JSON.stringify({
                    username: apiConfig.username,
                    password: apiConfig.password,
                }),
            });

            const data = await response.json();

            if (response.status === 200 || response.status === 201) {
                const token = data.accessToken;
                const expiresAt = new Date(Date.now() + 3600 * 60 * 60 * 1000).toUTCString();
                this.accessToken = token;

                await setDoc(doc(firestore, 'api_tokens', 'user_token'), {
                    token,
                    expiresAt,
                });


                await AsyncStorage.setItem('access_token', token);
                await AsyncStorage.setItem('expires_at', expiresAt.toString());

                console.log('Login successfully, and token saved successfully in firebase and localstorage');
            } else {
                throw new Error('Failed to login to SMS API');
            }

        } catch (error: any) {
            Alert.alert(error.message);
        }
    }


    // @ts-ignore
    protected async checkIfTokenExists() {

        const localToken = await AsyncStorage.getItem('user_token');
        const localExpiresAt = await AsyncStorage.getItem('expires_at');
        const currentTime = Date.now();

        if (localToken && localExpiresAt && currentTime < parseInt(localExpiresAt)) {
            this.accessToken = localToken;
            console.log('Valid token found in local storage.');
            return true;
        }

        // If no valid local token, check Firebase Firestore
        const getTokenFromFirebase = await getDoc(doc(firestore, 'api_tokens', 'user_token'));

        if (getTokenFromFirebase.exists()) {
            const {token, expiresAt} = getTokenFromFirebase.data() as { token: string; expiresAt: number };

            if (currentTime < expiresAt) {
                this.accessToken = token;

                //save the token in asyncstorage for quick access in next time
                await AsyncStorage.setItem('user_token', token);
                await AsyncStorage.setItem('expires_at', expiresAt.toString());

                console.log('Valid token found in local storage.');

                return true;
            }
        }

        // If no valid token is found, login again to get a new token
        await this.login();
    }


    async sendOtp(mobileNumber: string, otp: string) {

        // check if the token is available
        await this.checkIfTokenExists();
            console.log('send otp num', mobileNumber)
        try {
            const response = await fetch(`${apiConfig.baseUrl}/sendsms`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-VERSION': apiConfig.apiVersion,
                    'Authorization': `Bearer ${this.accessToken}`,
                },

                body: JSON.stringify({
                    campaignName: 'Test campaign',
                    mask: 'SpaCeylon',
                    numbers: `94${mobileNumber}`,
                    content: `Your OTP is ${otp}`,
                }),

            });
            console.log('otp status', response);
            if (response.status === 200 || response.status === 201) {
                console.log('OTP sent successfully.');
            } else {
                throw new Error('Failed to send OTP');
            }
        } catch (error: any) {
            Alert.alert('OTP Sending Error', error.message);
        }
    }

}

export default OtpService;