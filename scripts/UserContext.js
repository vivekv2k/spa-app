import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth,app } from "../firebaseConfig";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileColor, setProfileColor] = useState('#ccc');
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                try {
                    const userRef = doc(firestore, 'users', authUser.uid);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        setUserDetails(userDoc.data());
                        setUser({ uid: authUser.uid, ...userDoc.data() });
                        setProfileColor(generateRandomColor());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUser(null);
                setUserDetails(null);
                setProfileColor('#ccc');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const generateRandomColor = () => {
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    };

    return (
        <UserContext.Provider value={{ user, userDetails, loading, profileColor }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
