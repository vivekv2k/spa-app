import React, { useState,useRef,useEffect  } from 'react';
import { View, StyleSheet, Image, Dimensions, Alert, Text, ActivityIndicator, TouchableOpacity} from 'react-native';
import { useRouter } from "expo-router";
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { Colors } from '@/constants/Colors';
import { getAuth,deleteUser,fetchSignInMethodsForEmail , signOut,createUserWithEmailAndPassword,PhoneAuthProvider,onAuthStateChanged,signInWithCredential,linkWithCredential, Auth, PhoneAuthCredential, AuthCredential} from 'firebase/auth';

import {firestore, auth, app} from '@/firebaseConfig';
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    collection,
    where,
    getDocs,
    DocumentData,
    DocumentSnapshot
} from 'firebase/firestore';
// @ts-ignore
import logo from '../../assets/images/STAFF-APP-01.png';
import firebase from "firebase/compat";
import OtpService from '@/services/OtpService';
import CustomAlert from '../../scripts/CustomAlert';

const RegisterScreen: React.FC = () => {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1);
    const [verificationId, setVerificationId] = useState(null);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpExpirationTime, setOtpExpirationTime] = useState<Date | null>(null);
    const [verificationMessage, setVerificationMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [showResendButton, setShowResendButton] = useState(false);
    const [registerLoading , setRegisteroading] = useState(false);
    const [otpLoading , setOtpLoading] = useState(false);
    const [processStatus , setProcessStatus] = useState(false);
    const [processStatusMsg , setProcessStatusMsg] = useState('');
    const [timer, setTimer] = useState(60);
    const recaptchaVerifier = useRef(null);
    const authFirebase = getAuth();

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [loading, setLoading] = useState(false); 

    const isOtpVerifiedRef = useRef(isOtpVerified);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isOtpVerifiedRef.current = isOtpVerified;
        // Clear the timer if OTP is verified
        if (isOtpVerified && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }, [isOtpVerified]);
    


    let userDocRef = null;
    let userSnap: DocumentSnapshot<DocumentData, DocumentData> | null = null;
    let credential: AuthCredential | null  = null;
    let querySnapshot: any = null;


    const processRegisterTestOTP = async () => {
        await handleOTPService();
    };

    const handleRegister  = async () => {  
        setRegisteroading(true);
        setProcessStatus(true);
        setProcessStatusMsg('Please wait...');
        if(await userRegisterValidation()){
            try {
                // Check if mobile number exists in Firestore
                const usersCollection = collection(firestore, 'tempUsers');
                const q = query(usersCollection, where('mobile_number', '==', mobileNumber));
                querySnapshot = await getDocs(q);
    
                if (!querySnapshot.empty) {
                    //await createUser();
                    await handleOTPService();
                } else {
                    setRegisteroading(false);
                    setProcessStatus(false);
                    Alert.alert("Error", "Mobile number does not match with any system user records please contact HR");
                }
    
            } catch (error) {
                // @ts-ignore
                setRegisteroading(false);
                setProcessStatus(false);
                Alert.alert("Error reg", error.message);
            }
        }
       
    };

    const fetchUserData = async (uid: string) => {
        const userDoc = await getDoc(doc(firestore, 'users', uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Update any necessary local state or context with user data
            console.log("User data:", userDoc.data());
        } else {
            console.log("User data does not exist.");
        }
    };
    

    const createUser = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const firebaseUid = userCredential.user.uid;
                
                await movePendingUserData(firebaseUid);
        
                if (credential instanceof AuthCredential) {
                    await linkWithCredential(userCredential.user, credential);
                }
        
                resolve(userCredential); // Resolve with user credentials if needed
            } catch (error) {
                setProcessStatus(false);
                setOtpLoading(false);
                console.error("Error creating user:", error);
                reject(error); // Reject if there's an error
            }
        });
    };
    

    const movePendingUserData = async  (uid: string) => {
        return new Promise(async (resolve, reject) => {
            try {
                const usersCollection = collection(firestore, 'tempUsers');
                const q = query(usersCollection, where('mobile_number', '==', mobileNumber));
                const querySnapshot = await getDocs(q);
                console.log('user data empty', querySnapshot.empty);
                if (querySnapshot && !querySnapshot.empty) {
                    const docId = querySnapshot.docs[0].id;
                    const userDocRef = doc(firestore, 'tempUsers', docId);
                    const userSnap = querySnapshot.docs[0];
    
                    await setDoc(doc(firestore, 'users', uid), {
                        ...userSnap.data(),
                        email: email,
                        uid: uid,
                    });
    
                    // Delete the pending user record
                    await deleteDoc(userDocRef);
                    setProcessStatusMsg('Almost completed Your Registation');
                    console.log("Pending user data moved successfully.",userSnap.data());
                    resolve(); // Resolve the promise upon success
                } else {
                    setProcessStatus(false);
                    console.error("Pending user data does not exist.");
                    resolve(); // Resolve even if no data exists to avoid blocking
                }
            } catch (error) {
                setProcessStatus(false);
                console.error("Error moving pending user data:", error.message);
                reject(error); // Reject the promise on error
            }
        });
    };
    
    const formatMobileNumber = (mobileNumber: string): string => {
        if (mobileNumber.startsWith('0') && mobileNumber.length === 10) {
            // Remove the leading '0' and prepend the country code '+94'
            return mobileNumber.substring(1);
        } else {
            // Handle cases where the mobile number is not valid or in unexpected format
            console.error("Invalid mobile number format. Ensure it is a 10-digit number starting with '0'.");
            return mobileNumber;
        }
    };

    const checkOtpRequestStatus = async (mobileNumber) => {
        try {
            const userOtpLogRef = doc(firestore, 'user_otp_request_log', mobileNumber);
            const userOtpLogDoc = await getDoc(userOtpLogRef);
    
            if (userOtpLogDoc.exists()) {
                const data = userOtpLogDoc.data();
                console.log(data.request_count);
                if (data.request_count >= 5 && data.otp_status === false) {
                    setErrorMessage("Request Blocked You have reached the maximum OTP request limit. Please contact Admin.");
                    return false;
                } else if(data.request_count >= 5) {
                    await updateDoc(userOtpLogRef, {
                        otp_status: false,
                    });
                    setErrorMessage("Request Blocked You have reached the maximum OTP request limit. Please contact Admin.");    
                } else {
                    // Increment request count if under the limit
                    await updateDoc(userOtpLogRef, {
                        request_count: data.request_count + 1,
                    });
                }
            } else {
                // If log does not exist, initialize it for this user
                await setDoc(userOtpLogRef, {
                    mobile_number: mobileNumber,
                    request_count: 1,
                    otp_status: true,
                });
            }
    
            return true; // Allowed to request OTP
        } catch (error) {
            console.error("Failed to check OTP request status:", error);
            setErrorMessage("Error : An error occurred while checking OTP request status.");
            return false;
        }
    };
    

    const handleOTPService = async () => {
        const formatNumber = await formatMobileNumber(mobileNumber);
        console.log(formatNumber);

        setProcessStatusMsg('OTP Sending to the number '+ formatNumber);

        const isAllowed = await checkOtpRequestStatus(formatNumber);
        if (!isAllowed) return;
        
        const otpService = new OtpService();
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
            console.log(formatNumber);
        try {
            await otpService.sendOtp(formatNumber, generatedOtp);
            setGeneratedOtp(generatedOtp);
            setOtpExpirationTime(new Date(Date.now() + 60000));
            setRegisteroading(false);
            setProcessStatusMsg('OTP sent successfully');
            setProcessStatus(false);
            setStep(2);  // Move to the OTP input step
            console.log('OTP sent successfully.');

            startTimer();
        } catch (error) {
            console.error('Failed to send OTP:', error);
            Alert.alert('Error', 'Failed to send OTP');
            setRegisteroading(false);
        }
    };

    
    const startTimer = () => {
        let countdown = 60;
        const timerInterval = setInterval(() => {
            countdown -= 1;
            setTimer(countdown);
            if (countdown <= 0) {
                clearInterval(timerInterval);
                console.log('is otp is verifed', isOtpVerifiedRef.current);
                if (!isOtpVerifiedRef.current) { 
                    setGeneratedOtp(''); 
                    setOtpExpirationTime(null); 
                    setErrorMessage("The OTP has expired. Please request a new OTP.");
                    setShowResendButton(true); 
                }
            }
        }, 1000);
    };

    const handleVerifyOtp = async () => {
        setOtpLoading(true);
        setProcessStatus(true);
        setProcessStatusMsg('Please wait...');
        const currentTime = new Date();
    
        if (otp !== generatedOtp) {
            setOtpLoading(false);
            setProcessStatus(false);
            setErrorMessage("The OTP you entered is incorrect.");
            setShowResendButton(true);
            return;
        }
    
        if (otpExpirationTime && currentTime > otpExpirationTime) {
            setOtpLoading(false);
            setProcessStatus(false);
            setErrorMessage("The OTP has expired. Please request a new OTP.");
            setShowResendButton(true);
            return;
        }
    
        setIsOtpVerified(true);

        setErrorMessage('');
        setVerificationMessage("OTP Verification is Successful");
        setProcessStatusMsg('wait for a moment to complete your registation process');
        setTimer(null); 
       

        createUser()
        .then(() => {
            setOtpLoading(false);
            setProcessStatusMsg('User registered successfully! Please log in..');
            console.log('user is getting signout starting....');
            let signoutUser = signOut(auth);
            console.log('user signout is success....');
            setProcessStatusMsg('Register Success please login after redirected to the login page');
            setTimeout(() => {
                router.replace('/(auth)/LoginScreen');
            }, 2000); 
          
        })
        .catch((error) => {
            console.error("Error during registration:", error);
            setErrorMessage("Registration failed. Please try again.");
        });
    };


    const handleResendOtp = async () => {
       const formatNumber = await formatMobileNumber(mobileNumber);
        console.log(formatNumber);
        const isAllowed = await checkOtpRequestStatus(formatNumber);
        if (!isAllowed) return;
        
        setErrorMessage(''); 
        setVerificationMessage(''); 
        setOtp(''); 
    
        const otpService = new OtpService();
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a new OTP
        console.log("Resending OTP to:", formatNumber);
    
        try {
            await otpService.sendOtp(formatNumber, newOtp);
            setGeneratedOtp(newOtp);
            setOtpExpirationTime(new Date(Date.now() + 60000)); 
    
            setShowResendButton(false); 
            startTimer(); 
            console.log("OTP resent successfully.");
        } catch (error) {
            console.error('Failed to resend OTP:', error);
            Alert.alert('Error', 'Failed to resend OTP');
        }
    };
    

    const userRegisterValidation = async () => {
        if (!email) {
            setRegisteroading(false);
            setProcessStatus(false);
            setAlertMessage('Email is required.');
            setAlertVisible(true);
            return false;
        }

    
        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            setRegisteroading(false);
            setProcessStatus(false);
            setAlertMessage('Please enter a valid email address.');
            setAlertVisible(true);
            return false;
        }

        const usersCollection = collection(firestore, "users");
        const q = query(usersCollection, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setRegisteroading(false);
            setProcessStatus(false);
            setAlertMessage('Email is already registered. Please use a different email');
            setAlertVisible(true);
            return false;
          }

          if (!mobileNumber) {
            setRegisteroading(false);
            setProcessStatus(false);
            setAlertMessage('Mobile number is required.');
            setAlertVisible(true);
            return false;
        }

          if (!/^0\d{9}$/.test(mobileNumber)) {
            setRegisteroading(false);
            setProcessStatus(false);
            setAlertMessage('Mobile number must be 10 digits and start with 0.');
            setAlertVisible(true);
            return false;
        }

        if (password !== confirmPassword) {
            setRegisteroading(false);
            setProcessStatus(false);
            setAlertMessage('Passwords do not match');
            setAlertVisible(true);
            return false;
        }

        if (password.length < 6) {
            setRegisteroading(false);
            setProcessStatus(false);
            setAlertMessage('Password must be at least 6 characters');
            setAlertVisible(true);
            return false;
        }


        return true;
    };

    return (
        <View style={styles.container}>
            {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.secondary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
            ):(
                <>
                    <Image source={logo} style={styles.logo}
            />


            {step === 1 ? (
                <>
                    <InputField
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <InputField
                        placeholder="Phone Number"
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                    />
                    <InputField
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <InputField
                        placeholder="Confirm Password"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <View id="recaptcha-container"></View>
                   

                    <TouchableOpacity
                        onPress={handleRegister}
                        style={[styles.registerButton, registerLoading && styles.disabledButton]}
                        disabled={registerLoading} // Disable button while loading 
                        >
                        {registerLoading ? (
                            <Text style={styles.buttonText}><ActivityIndicator size="small" color="black" /></Text>
                        ) : (
                            <Text style={styles.buttonText}>Register</Text>
                        )}
                    </TouchableOpacity>
                    {processStatus ? (<Text style={styles.processStatusText}>{processStatusMsg}</Text>): (null)}

                    {errorMessage ? ( <Text style={styles.errorText}>{errorMessage}</Text>) : (null)}
                </>
            ) : (
                <>
                    <InputField
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                    />

                    <TouchableOpacity
                        onPress={handleVerifyOtp}
                        style={[styles.verifyButton, otpLoading && styles.disabledButton]}
                        disabled={otpLoading}
                        >
                        {otpLoading ? (
                            <Text style={styles.buttonText}><ActivityIndicator size="small" color="black" /></Text>
                        ) : (
                            <Text style={styles.buttonText}>Verify OTP</Text>
                        )}
                    </TouchableOpacity>

                
                   
                    {processStatus ? (<Text style={styles.processStatusText}>{processStatusMsg}</Text>): (null)}

                    {errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : verificationMessage ? (
                        <Text style={styles.successText}>{verificationMessage}</Text>
                    ) : (
                        <Text style={styles.timerText}>
                            {`Time remaining: ${timer} seconds`}
                        </Text>
                    )}

                    {showResendButton && (
                        <Text style={styles.resendText} onPress={handleResendOtp}>Resend OTP</Text>
                    )}
                </>
            )}
            <CustomAlert
                visible={alertVisible}
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />  
                </>
            )}
        </View>
    );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: Colors.primary,
    },
    verifyButton: {
        backgroundColor: Colors.secondary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        display:"flex"
    },
    registerButton: {
        backgroundColor: Colors.secondary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        display:"flex",
        fontFamily:'TrajanPro-Regular'
    },
    disabledButton: {
        backgroundColor: Colors.secondary,
        display:"flex"
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily:'TrajanPro-Bold',
        color: 'black',
        fontSize: 14,
        display:"flex"
    },
    logo: {
        width: width * 0.8,
        height: undefined,
        aspectRatio: 1,
        marginBottom:0,
        margin:24
    },
    timerText: {
        color: 'red',
        fontSize: 10,
        marginTop: 10,
        textAlign: 'center',
        fontFamily:'TrajanPro-Regular'
    },
    successText: {
        color: 'green',
        fontSize: 10,
        marginTop: 10,
        textAlign: 'center',
        fontFamily:'TrajanPro-Regular'
    },
    errorText: {
        color: 'red',
        fontSize: 10,
        marginTop: 10,
        textAlign: 'center',
        fontFamily:'TrajanPro-Regular'
    },
    processStatusText:{
        color: Colors.secondary,
        fontSize: 10,
        marginTop: 10,
        textAlign: 'center',
        fontFamily:'TrajanPro-Regular'
    },
    resendText: {
        color: Colors.secondary,
        fontSize: 10,
        marginTop: 10,
        textAlign: 'center',
        fontFamily:'TrajanPro-Regular',
        textDecorationLine: 'underline',
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        color: Colors.secondary, 
        fontSize: 18, 
        marginTop: 10 
    },
});

export default RegisterScreen;
