import {Redirect, Stack, Tabs, useRouter} from "expo-router";
import {Feather} from '@expo/vector-icons';
import {ActivityIndicator, StatusBar, StyleSheet, Text, View} from "react-native";
import {useContext, useEffect, useState} from "react";
import {SafeAreaView} from 'react-native-safe-area-context'; // Import SafeAreaView
import {UserContext} from '@/context/UserContext';
import HomeScreen from '../(tabs)/index';
import PostScreen from '../(tabs)/Post';
import SalesScreen from '../(tabs)/Sales';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from "@/components/CustomTabBar";
const Tab = createBottomTabNavigator();

export default function TabLayout() {

    const {user,loading,error,userType,userDetailsLoading } = useContext(UserContext);
  
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text>An error occurred: {error.message}</Text>
            </View>
        );
    }

    if(userDetailsLoading){
        return (
            <View style={styles.centerContainer}>
                <Text>wait the user is loading <ActivityIndicator size="large" color="#0000ff" /></Text>
            </View>
        );
    }

    if(!loading){
        if (!user) {
            // @ts-ignore
            return <Redirect href={"/(auth)/LoginScreen"}/>;
        }
    }

    return (
        <SafeAreaView style={styles.safeAreaView} edges={['left', 'right', 'bottom']}>
            <Tab.Navigator
                tabBar={(props) => <CustomTabBar {...props} userType={userType} />}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        title: 'Home',
                        tabBarIconName: 'home',
                    }}
                />
                <Tab.Screen
                    name="Post"
                    component={PostScreen}
                    options={{
                        title: 'Post',
                        tabBarIconName: 'edit',
                    }}
                />
                <Tab.Screen
                    name="Sales"
                    component={SalesScreen}
                    options={{
                        title: 'Sales',
                        tabBarIconName: 'bar-chart-2',
                    }}
                />
            </Tab.Navigator>
            <StatusBar barStyle="light-content" backgroundColor="#000000"/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1,
        backgroundColor: '#fff', // Match background color with the tab bar
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
