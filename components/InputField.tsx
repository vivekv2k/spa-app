import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import commonStyles from '../assets/css/commonStyles';

interface InputFieldProps extends TextInputProps {
    placeholder: string;
    secureTextEntry?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ placeholder, secureTextEntry, ...props }) => {
    return (
        <TextInput
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            style={commonStyles.roundedInput}
            {...props}
        />
    );
};

export default InputField;
