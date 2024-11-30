import { Redirect,Slot,Stack, useRouter } from "expo-router";
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { useFonts } from "expo-font";
import {useContext, useEffect, useState} from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '@/firebaseConfig';  // Adjust the path if necessary
import { UserContext } from '@/context/UserContext';

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'notoSans': require('../assets/fonts/NotoSans.ttf'),
        'Raleway-Regular': require('../assets/fonts/Raleway-Regular.ttf'),
        'Raleway-Bold': require('../assets/fonts/Raleway-Bold.ttf'),
    });

    const { user,loading } = useContext(UserContext);
    const router = useRouter();



    if (loading || !fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

  /*  return (
        <>
            <Stack>
                {/!* Auth screens *!/}
                <Stack.Screen name="auth/LoginScreen" options={{ title: "Login", headerShown: false }} />
                <Stack.Screen name="auth/RegisterScreen" options={{ title: "Register", headerShown: false }} />

                {/!* Tabs screen - shown only if user is logged in *!/}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            </Stack>
        </>
    );*/

    return <Slot />;

   /* return (
        <>
            <Slot />
        </>
    );*/
}
