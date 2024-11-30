import { Slot } from "expo-router";
import React, {useContext, useEffect, useRef, useState} from 'react';
import {StatusBar, View, ActivityIndicator, Text, Alert, Platform} from 'react-native';
import { useFonts } from "expo-font";
import {UserContext, UserProvider } from '@/context/UserContext';
import * as Notifications from "expo-notifications";
import * as TaskManager from 'expo-task-manager';

console.log('layout loading');
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

  // Define the background task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
    if (error) {
        console.error('Background task error:', error);
        return;
    }
    console.log('Received a notification in the background!', data);
});

// Register the background task once when component mounts
async function registerBackgroundNotificationTask() {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
        if (!isRegistered) {
            await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
            console.log('Background notification task registered');
        }
    } catch (error) {
        console.error('Error registering background notification task:', error);
    }
}

export default function RootLayout() {

    const notificationListener = useRef();
    const responseListener = useRef();
  

    useEffect(() => {
        registerBackgroundNotificationTask();
        
        // @ts-ignore
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });
         // @ts-ignore
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response received:', response);
        });

        return () => {
             // @ts-ignore
            Notifications.removeNotificationSubscription(notificationListener.current);
             // @ts-ignore
            Notifications.removeNotificationSubscription(responseListener.current);
        };

        
    }, []);

    console.log('loading layout body');
    

    const [fontsLoaded,error] = useFonts({
        'notoSans': require('../assets/fonts/NotoSans.ttf'),
        'Raleway-Regular': require('../assets/fonts/Raleway-Regular.ttf'),
        'Raleway-Bold': require('../assets/fonts/Raleway-Bold.ttf'),
        'TrajanPro-Regular': require('../assets/fonts/TrajanPro-Regular.ttf'),
        'TrajanPro-Bold': require('../assets/fonts/TrajanPro-Bold.otf'),
    });

    if (error) {
        console.error('Error loading fonts:', error);
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Error loading fonts. Please check your font files.</Text>
            </View>
        );
    }
    console.log('font loading status ',fontsLoaded);
    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <UserProvider>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <Slot />
        </UserProvider>
    );
}
