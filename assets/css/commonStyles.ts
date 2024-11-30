import { StyleSheet } from 'react-native';
import {Colors} from '@/constants/Colors';

const commonStyles = StyleSheet.create({
    roundedInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginVertical: 10,
        borderColor: Colors.inputBorder,
        backgroundColor: Colors.inputBorder,
        fontFamily: 'Raleway-Regular',
    },
    button: {
        backgroundColor: Colors.secondary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: Colors.primary,
        fontSize: 16,
        fontFamily: 'Raleway-Bold',
    },
    linkText: {
        color: Colors.grayText,
        textAlign: 'center',
        marginTop: 15,
        fontFamily: 'TrajanPro-Regular',
        fontSize:9
    },
    versionText: {
        color: Colors.grayText,
        textAlign: 'center',
        marginTop: 50,
        fontFamily: 'TrajanPro-Regular',
        fontSize:10
    },
});

export default commonStyles;
