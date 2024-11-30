import { useContext } from 'react';
import {Redirect, Slot, Stack, useRouter} from 'expo-router';
import { UserContext } from '@/context/UserContext';

export default function AuthLayout() {
    const { user,loading,userLoading } = useContext(UserContext);
    
    if(!loading){
        if (user && userLoading) {
            // @ts-ignore
            console.log('auth');
            return <Redirect href={"/(tabs)"} />;
        }
    }
    
    return (
        <>
            <Stack>
                <Stack.Screen name="LoginScreen" options={{ title: "Login", headerShown: false }} />
                <Stack.Screen name="RegisterScreen" options={{ title: "Register", headerShown: false }} />
                <Stack.Screen name="PasswordResetScreen" options={{ title: "PasswordReset", headerShown: false }} />
            </Stack>
        </>
    );
}
