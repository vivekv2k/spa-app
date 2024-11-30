import React, {useContext, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator} from 'react-native';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import commonStyles from '@/assets/css/commonStyles';
import {Colors} from '@/constants/Colors';
import { useRouter } from "expo-router";
// @ts-ignore
import { Feather } from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../../firebaseConfig';
// @ts-ignore
import type {RootStackParamList} from '@/types';
// @ts-ignore
import logo from '../../assets/images/STAFF-APP-01.png';
import CustomAlert from '../../scripts/CustomAlert';
import {Link} from "expo-router";

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoginScreen'>;

const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setPasswordVisible] = useState(false); // state for password visibility
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [userLoadingStatus , setUserLoadingStatus] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setUserLoadingStatus(true);
        try {
            await signInWithEmailAndPassword(auth, username, password);
            setUserLoadingStatus(false);
            navigation.replace('(tabs)');
        } catch (error) {
            // @ts-ignore
            setUserLoadingStatus(false);
            setAlertMessage('login error');
            setAlertVisible(true);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={logo} style={styles.logo} />

            <InputField
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />

            <View style={styles.passwordWrapper}>

                <InputField
                    placeholder="Password"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                    <Feather  name={isPasswordVisible ? "eye-off" : "eye"}
                              size={24}
                              color={Colors.secondary}/>
                </TouchableOpacity>

            </View>


            <TouchableOpacity onPress={handleLogin}
                    style={[styles.verifyButton, userLoadingStatus && styles.disabledButton]} disabled={userLoadingStatus} >
                    {userLoadingStatus ? (
                        <Text style={styles.buttonText}><ActivityIndicator size="small" color="black" /></Text>
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
            </TouchableOpacity>

            <Text style={commonStyles.linkText}>
                If you don't have an account, please{' '}
                <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
                    <Text style={styles.link}>Register here</Text>
                </TouchableOpacity>
            </Text>

              {/* "Forgot Password?" Link */}
            <TouchableOpacity onPress={() => navigation.navigate('PasswordResetScreen')}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            {/* "Forgot Password?" Link */}
            
            <View>
                <Text style={commonStyles.versionText}>version 1.0.0</Text>
            </View>

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
    link: {
        color: Colors.secondary,
        textDecorationLine: 'underline',
        paddingTop:19,
        fontFamily:'TrajanPro-Regular',
        fontSize:10
    },
    logo: {
        width: width * 0.8,
        height: undefined, 
        aspectRatio: 1, 
        marginBottom: -60, 
        margin: 24
    },
    passwordWrapper: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 40, 
        backgroundColor: '#fff',
        color: '#000', 
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 20, 
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
    forgotPassword: {
        color: Colors.secondary,
        textDecorationLine: 'underline',
        marginTop: 50,
        textAlign: 'center',
        fontFamily: 'TrajanPro-Regular',
        fontSize: 10,
    },
    buttonText: {
        fontFamily:'TrajanPro-Bold',
        color: 'black',
        fontSize: 14,
        display:"flex"
    },
    disabledButton: {
        backgroundColor: Colors.secondary,
        display:"flex"
    },
});

export default LoginScreen;
