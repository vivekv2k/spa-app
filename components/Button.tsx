import React from 'react';
import { TouchableOpacity, Text, StyleSheet,ViewStyle  } from 'react-native';
import commonStyles from '../assets/css/commonStyles';

interface ButtonProps {
    title: string;
    onPress: () => void;
    buttonStyle?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({ title, onPress,buttonStyle  }) => {
    return (
        <TouchableOpacity style={[commonStyles.button, buttonStyle]} onPress={onPress}>
            <Text style={commonStyles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
};

export default Button;
