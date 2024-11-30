import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert,Dimensions, StyleSheet,Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { getAuth,deleteUser,sendPasswordResetEmail , signOut,createUserWithEmailAndPassword,PhoneAuthProvider,onAuthStateChanged,signInWithCredential,linkWithCredential, Auth, PhoneAuthCredential, AuthCredential} from 'firebase/auth';
import {firestore, auth, app} from '@/firebaseConfig';
import logo from '../../assets/images/STAFF-APP-01.png';
import InputField from '../../components/InputField';
import { Colors } from '@/constants/Colors';
import CustomAlert from "@/scripts/CustomAlert";
const PasswordResetScreen = () => {

  const [email, setEmail] = useState("");
  const [resetLoading , setResetLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handlePasswordReset = async () => {
    if (!email) {
      setAlertMessage('Please enter your email address.');
      setAlertVisible(true);
      return;
    }
    
    try {
      setResetLoading(true);

      await sendPasswordResetEmail(auth, email);

      setAlertMessage('Password reset email sent. Please check your inbox');
      setAlertVisible(true);
    
      setEmail(""); 

      setResetLoading(false);

    } catch (error) {
        setResetLoading(false);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
         <Image source={logo} style={styles.logo}/>
      <Text style={styles.title}>Reset Password</Text>
      <InputField
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
        />

      <TouchableOpacity
                        onPress={handlePasswordReset}
                        style={[styles.resetButton, resetLoading && styles.disabledButton]}
                        disabled={resetLoading} // Disable button while loading 
                        >
                        {resetLoading ? (
                            <Text style={styles.buttonText}><ActivityIndicator size="small" color="black" /></Text>
                        ) : (
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                        )}
                    </TouchableOpacity>
                    <CustomAlert
                visible={alertVisible}
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />  
    </View>
  );
};
const {width} = Dimensions.get('window'); // Get the screen width

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: Colors.primary,
    },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
  },
  logo: {
    width: width * 0.8, // 80% of the screen width
    height: undefined, // Let height be determined by the image's aspect ratio
    aspectRatio: 1, // Adjust aspect ratio to fit your image
    marginBottom:-60, // Space between the image and input fields
    margin:24
    },
   resetButton: {
        backgroundColor: Colors.secondary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        display:"flex"
    },
    disabledButton: {
        backgroundColor: Colors.secondary,
        display:"flex"
    },
    buttonText: {
        fontFamily:'TrajanPro-Bold',
        color: 'black',
        fontSize: 14,
        display:"flex"
    },
});

export default PasswordResetScreen;
