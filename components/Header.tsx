import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UserContext } from '@/context/UserContext';
import { signOut } from "firebase/auth";
import { auth, firestore } from "@/firebaseConfig";
import { doc, collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";

export default function UserHeader() {

    const navigation = useNavigation();
    const { userDetails, profileColor, loading, expoPushToken } = useContext(UserContext);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [loadUserLogout, setLoadUserLogout] = useState(false);
    const router = useRouter();

    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    };

    const handleLogout = async () => {
        setLoadUserLogout(true);
        try {
            if (expoPushToken) {
                const userRef = doc(firestore, 'users', auth.currentUser.uid);
                const tokenQuery = query(collection(userRef, 'tokens'), where("token", "==", expoPushToken));
                const tokenSnapshot = await getDocs(tokenQuery);

                for (const tokenDoc of tokenSnapshot.docs) {
                    await deleteDoc(tokenDoc.ref);
                }
            }
            await signOut(auth);
            router.replace('/(auth)/LoginScreen');
        } catch (error) {
            alert('Error logging out: ' + error.message);
        } finally {
            setLoadUserLogout(false);
        }
    };

    const initials = userDetails ? getInitials(userDetails.first_name, userDetails.last_name) : '';

    return (
        <View style={styles.headerContainer}>
            {loadUserLogout ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <View style={styles.profileSection}>
                    <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)}>
                        <View style={[styles.profileImage, { backgroundColor: profileColor }]}>
                            <Text style={styles.initials}>{initials}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.textContainer}>
                        {loading ? (
                            <ShimmerPlaceholder
                                visible={!loading}
                                style={styles.shimmerPlaceholder}
                            />
                        ) : (
                            userDetails ? (
                                <>
                                    <Text style={styles.welcomeText}>Welcome</Text>
                                    <Text style={styles.userName}>{userDetails.first_name} {userDetails.last_name}</Text>
                                </>
                            ) : (
                                <ShimmerPlaceholder
                                style={styles.shimmerPlaceholder}
                            />
                            )
                        )}
                    </View>

                    {dropdownVisible && (
                        <View style={styles.dropdown}>
                            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
                                <Feather name="log-out" size={16} color="#000" />
                                <Text style={styles.dropdownText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
            {/* <Feather name="bell" size={24} color="black" style={styles.notificationIcon} /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 40,
        paddingHorizontal: 18,
    },
    shimmerPlaceholder: {
        width: 200,
        height: 50,
        borderRadius: 10,
        marginLeft: 10,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textContainer: {
        justifyContent: 'center',
    },
    welcomeText: {
        fontSize: 10,
        color: '#666',
        marginLeft: 4,
        fontFamily:'TrajanPro-Regular'
    },
    userName: {
        fontSize: 13,
        color: '#000000',
        textTransform: 'capitalize',
        fontFamily:'TrajanPro-Bold'
    },
    notificationIcon: {
        padding: 8,
    },
    initials: {
        color: '#fff',
        fontFamily:'TrajanPro-Bold'
    },
    dropdown: {
        position: 'absolute',
        top: 50,
        right: 0,
        left: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        elevation: 5,
        zIndex: 1000,
        width: 100
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10
    },
    dropdownText: {
        marginLeft: 8,
        fontFamily:'TrajanPro-Bold',
        fontSize:10
    },
});
