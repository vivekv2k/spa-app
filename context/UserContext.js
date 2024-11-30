import React, {createContext, useState, useEffect, useRef} from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection,setDoc,serverTimestamp,getDocs,query, where  } from "firebase/firestore";
import { useRouter } from 'expo-router';
import { firestore, auth } from '@/firebaseConfig';
import * as Notifications from "expo-notifications"; // Import Firebase services
import { Alert, Platform } from 'react-native';
console.log('context loading');

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [userType, setUserType] = useState(null);
    const [profileColor, setProfileColor] = useState('#ccc');
    const [loading, setLoading] = useState(true);
    const [expoPushToken, setExpoPushToken ] = useState('');
      // State variables to track each step
    const [tempTKSt , setTempTKSt] = useState('');
    const [stepAuth, setStepAuth] = useState('');
    const [stepPermission, setStepPermission] = useState('');
    const [stepToken, setStepToken] = useState('');
    const [stepSaveToken, setStepSaveToken] = useState('');
    const [userLoading , setUserLoading] = useState(false);
    const [userDetailsLoading, setUserDetailsLoading] = useState(true);
    const router = useRouter();
    const [isUserDataStored, setIsUserDataStored] = useState(false); // New state
    const [refreshKey, setRefreshKey] = useState(0);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUserLoading(true);
            setUserDetailsLoading(true); 
            console.log(currentUser);
            setStepAuth('Checking authentication status...');
            if (currentUser) {
                setUser(currentUser);
                setStepAuth('User authenticated');

       
                setUserDetailsLoading(false);
                setStepPermission('Starting push notification registration');
                
                fetchUserDetails(currentUser.uid)
                .then((userData) => {
                    if (userData) {
                        router.push('/');
                    }
                })
                .catch((error) => {
                    console.error("Error in setup:", error);
                })
                .finally(() => {
                    setUserDetailsLoading(false);
                    setLoading(false);
                });

                registerForPushNotificationsAsync().then((token) => {
                    setExpoPushToken(token);
                })
            } else {
                // Reset state on logout
                setUser(null);
                setUserDetails(null);
                setUserType(null);
                setProfileColor('#ccc');
                setUserDetailsLoading(false);
            }

            setLoading(false); 
            setUserLoading(true);
        });

        return unsubscribe;
    }, []);
    


    function fetchUserDetails(uid) {
        return new Promise((resolve, reject) => {
            const userRef = doc(firestore, 'users', uid);
            getDoc(userRef)
                .then((userDoc) => {
                    console.log('checking if the user is exist', userDoc.exists());
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserDetails(userData);
                        setUserType(userData.user_type);
                        setProfileColor(prevColor => prevColor === '#ccc' ? generateRandomColor() : prevColor);
                        resolve(userData); // Resolve the promise with user data
                    } else {
                        console.log("User data does not exist in Firestore.");
                        resolve(null); // Resolve with null if no data exists
                    }
                })
                .catch((error) => {
                    console.error("Error fetching user details:", error);
                    reject(error); // Reject the promise with an error
                })
                .finally(() => {
                    setUserDetailsLoading(false);
                });
        });
    }
    

    // Function to generate a random color
    const generateRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    async function registerForPushNotificationsAsync() {
        setTempTKSt('register function started ....');
        try {
            console.log('success loading token');
            setTempTKSt('permission function started ....');
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
    
            if (existingStatus !== 'granted') {
                setTempTKSt('grant request started ....');
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
    
            if (finalStatus !== 'granted') {
                setTempTKSt('Failed to get push token for push notification! ....');
                console.log('Failed to get push token for push notification!');
                return;
            }


            setTempTKSt('token genaration started ....');
            //const tokenData = await Notifications.getExpoPushTokenAsync();
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'bd15d55a-108e-43ea-801f-ba6c1b5557fe'
            });
            
            const token = tokenData.data;
            setTempTKSt('Expo Push Token ....');
            console.log('Expo Push Token:', token);
    
            if (Platform.OS === 'android') {
                setTempTKSt('channels ....');
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
    
                await Notifications.setNotificationChannelAsync('urgent', {
                    name: 'Urgent Notifications',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 500, 500, 500],
                    lightColor: '#FF0000',
                    sound: 'emergency',
                    bypassDnd: true, // Bypass Do Not Disturb mode
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,  // Ensure it's visible
                });
            }
            

            setTempTKSt('save notification function started');
            await saveNotificationTokenIfNotExist(token); // Call only after token setup is confirmed
            return token;

        } catch (error) {
            setTempTKSt('Error in registerForPushNotificationsAsync:'+ error);
            console.error('Error in registerForPushNotificationsAsync:', error);
        }finally{
            setTempTKSt('all done');
            console.log('success loading token');
        }
    }


    

    async function saveNotificationTokenIfNotExist(token) {
        try {
            setTempTKSt('save notification token function');
            setStepToken('token function start');
            console.log('save notification token function', token);
            const userRef = doc(firestore, 'users', auth.currentUser.uid);
            const tokensRef = collection(userRef, 'tokens');
            const tokenSnapshot = await getDocs(tokensRef);
    
           let tokenExists = false;
           setTempTKSt('token searching');
           setStepToken('token searching');
         
            tokenSnapshot.forEach((doc) => {
                console.log(doc.data().token);
                if (doc.data().token === token) {
                    tokenExists = true;
                }
            });



            if (!tokenExists) { 
                setTempTKSt('token save started ....');
                setStepToken('token save started ....');
                const newTokenRef = doc(tokensRef); // Automatically generates a unique token document ID
                await setDoc(newTokenRef, {
                    token: token,
                    device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
                    created_at: serverTimestamp(),
                });
                setTempTKSt('Token stored in Firestore with metadata');
                setStepToken('Token stored in Firestore with metadata');
                console.log("Token stored in Firestore with metadata");
            } else {
                setTempTKSt('Token already exists in Firestore, skipping save');
                setStepToken('Token already exists in Firestore, skipping save');
                console.log("Token already exists in Firestore, skipping save");
            }
        } catch (error) {
            setTempTKSt('Error saving notification token:'+ error);
            setStepToken('Error saving notification token:'+ error);
            console.error('Error saving notification token:', error);
        }
    }


    return (
        <UserContext.Provider value={{ user, userDetails, userType, profileColor, loading, expoPushToken,tempTKSt,stepAuth,stepToken,userDetailsLoading }}>
            {children}
        </UserContext.Provider>
    );
};
