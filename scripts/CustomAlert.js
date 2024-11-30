// CustomAlert.js
import React from 'react';
import { Modal, View, Text, StyleSheet, Button } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Import Feather icons

const CustomAlert = ({ visible, message, onClose }) => {
    return (
        <Modal transparent={true} visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.messageContainer}>
                        <Feather name="info" size={24} color="#007BFF" style={styles.icon} />
                        <Text style={styles.message}>{message}</Text>
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button title="OK" onPress={onClose} color="#007BFF" />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    message: {
        fontSize: 13,
        marginBottom: 20,
        textAlign: 'left', 
        fontFamily: 'TrajanPro-Regular',
        lineHeight: 24, 
    },
    buttonContainer: {
        width: '100%',
        borderRadius: 5,
        overflow: 'hidden',
    },
    messageContainer: {
        flexDirection: 'row', 
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    icon: {
        marginRight: 10,
        marginTop: 4,
    },
});

export default CustomAlert;
