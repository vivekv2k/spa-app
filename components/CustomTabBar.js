import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
const CustomTabBar = ({ state, descriptors, navigation, userType }) => {
    console.log('user type is' + userType);
    return (
        <View style={styles.tabBar}>
            {state.routes.map((route, index) => {

                if (route.name === 'Post' && userType !== '1') {
                    console.log('Post tab hidden for userType:', userType);
                    return null;
                }

                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.name}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tabItem}
                    >
                        <Feather name={options.tabBarIconName} size={20} color={isFocused ? Colors.blue : 'rgba(170,169,169,0.55)'} />
                        <Text  style={[styles.tabBarText, { color: isFocused ? Colors.blue : 'rgba(170,169,169,0.55)' }]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#fff',
        height: 60,
        elevation: 5, // Shadow effect for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabItem: {
        alignItems: 'center',
        padding: 10
    },
    tabBarText:{
        fontSize:12,
        fontFamily:'TrajanPro-Regular'
    },
    tabItemFocused: {
        borderTopWidth: 2,
        borderTopColor: '#673ab7', // Highlight color when focused
    },
});

export default CustomTabBar;
