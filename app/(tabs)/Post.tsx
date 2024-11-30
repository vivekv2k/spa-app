import React, {useContext, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert, Button,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import * as Notifications from 'expo-notifications';
import {AndroidNotificationPriority} from 'expo-notifications';
import {Picker} from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';
import {firestore, storage, } from "@/firebaseConfig";
import {addDoc, collection , doc, getDoc, updateDoc } from 'firebase/firestore';
import {Feather} from '@expo/vector-icons';
import CustomAlert from '../../scripts/CustomAlert';
import {Asset} from 'expo-asset';
import {UserContext} from '@/context/UserContext';
import { useLocalSearchParams ,useRouter  } from 'expo-router';
import { useFocusEffect ,useNavigation} from '@react-navigation/native';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { useRoute } from '@react-navigation/native';

export default function Post({ postData }) {
    const [postType, setPostType] = useState('Offer');
    const [heading, setHeading] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState(null);
    const [ytLinks, setYTLinks] = useState('');
    const [links, setLinks] = useState('');
    const [pushNotification, setPushNotification] = useState(true);
    const [notificationUrgency, setNotificationUrgency] = useState('Medium');
    const [expiredDate, setExpiredDate] = useState(new Date());
    const [validFrom , setValidFrom] = useState(new Date());
    const [validTo, setValidTo] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showValidFromDatePicker , setShowValidFromDatePicker] = useState(false);
    const [showValidToDatePicker , setShowValidToDatePicker] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const notificationListener = useRef();
    const responseListener = useRef();
    const [expiredTime, setExpiredTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [includeTime, setIncludeTime] = useState(false);
    const [ submitLoading , setSubmitLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const { userDetails ,user,expoPushToken,loading } = useContext(UserContext);
    const params = useLocalSearchParams();
    const router = useRouter();
    const navigation = useNavigation();
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const route = useRoute();
	const functions = getFunctions();
    const sendPushNotificationToAllUsers = httpsCallable(functions, 'sendPushNotificationToAllUsers');
   
    useEffect(() => {
      
        if (postData) {
       
            setIsEditMode(true);
            setPostType(postData.post_type || 'Offer');
            setHeading(postData.title || '');
            setCode(postData.code || '');
            setDescription(postData.description || '');
            setImageUrl(postData.image_url || null);
            setYTLinks(postData.youtube_url || '');
            setLinks(postData.additionalLinks || '');
            setPushNotification(postData.push_notification || true);
            setNotificationUrgency(postData.notification_urgency || 'Medium');
            setExpiredDate(postData.expired_date ? new Date(postData.expired_date) : new Date());
            setValidFrom(postData.expired_date_start  ? new Date(postData.expired_date_start) : new Date());
            setValidTo(postData.expired_date_end ? new Date(postData.expired_date_end) : new Date());
        }
    }, [postData]);

    // @ts-ignore
    useEffect(() => {
        // @ts-ignore
        if(route.params && route.params.id){
            setIsEditMode(true);
            loadItemData();
        }else{
            setIsEditMode(false);
            clearFields();
        }
        setIsLoading(false);
    }, [route.params?.id]);

   

    const loadItemData = async () => {
        // @ts-ignore
        if (route.params.id) {
            try {
                // @ts-ignore announcement_dev
                const docRef = doc(firestore, 'announcement_dev', route.params.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPostType(data.post_type);
                    setHeading(data.title);
                    setCode(data.code || '');
                    setDescription(data.description);
                    setImageUrl(data.image_url);
                    setYTLinks(data.youtube_url || '');
                    setLinks(data.additionalLinks || '');
                    setPushNotification(data.push_notification);
                    setNotificationUrgency(data.notification_urgency);

                    const expDate = data.expired_date ? new Date(data.expired_date) : new Date();
                    const expDateStart = data.expired_date_start ? new Date(data.expired_date_start) : new Date();
                    const expDateEnd = data.expired_date_end ? new Date(data.expired_date_end) : new Date();
                    setValidFrom(expDateStart);
                    setValidTo(expDateEnd);

                    setExpiredDate(expDate);
                    setExpiredTime(expDate);
                    setIncludeTime(!!data.expired_date_start);
                }
            } catch (error) {
                console.error('Error loading announcement data:', error);
            } 
        } else {
            setIsLoading(false);
        }
    };


    const allowedExtensions = ['jpg', 'jpeg', 'png']; // Allowed file extensions
    const validateImageType = (uri) => {
        const extension = uri.split('.').pop().toLowerCase(); // Get file extension
        return allowedExtensions.includes(extension);
    };
  



    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            alert("Permission to access gallery is required!");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            allowsEditing: false, // Set too false to allow full image selection
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            if (!validateImageType(imageUri)) {
                setAlertMessage("Only JPEG and PNG images are allowed");
                setAlertVisible(true);
                return;
            }

            // @ts-ignore
            setImageUrl(imageUri);
        }
    };

    const generateAnnouncementNo = () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
    };



    const uploadImageToFirebase = async (uri) => {

        try {
            // Check if the URI is valid
            if (!uri) {
                throw new Error('Invalid image URI');
            }

            // Create a blob from the image URI
            const response = await fetch(uri);
            if (!response.ok) {
                throw new Error('Failed to fetch the image');
            }

            const blob = await response.blob();

            // Create a reference in Firebase Storage
            const storageRef = ref(storage, `images/${Date.now()}`);

            // Upload the file
            const snapshot = await uploadBytes(storageRef, blob);

            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
          } catch (error) {
              console.error('Error uploading image:', error);
              return null;
          }
    };
    const resetTimeToMidnightUTC = (date) => {
        const newDate = new Date(date);
        newDate.setUTCHours(0, 0, 0, 0); // Set the time to 00:00:00 UTC
        return newDate;
    };

    const combineDateAndTimeToLocalISOString = (date, time) => {
		// Create a new Date object using the date and time components
		const combinedDateTime = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			time.getHours(),
			time.getMinutes(),
			time.getSeconds() || 0,
			time.getMilliseconds() || 0 // Optional: clear milliseconds
		);
	
		// Format the combined date and time as "YYYY-MM-DDTHH:MM:SS" without UTC adjustment
		const year = combinedDateTime.getFullYear();
		const month = String(combinedDateTime.getMonth() + 1).padStart(2, '0');
		const day = String(combinedDateTime.getDate()).padStart(2, '0');
		const hours = String(combinedDateTime.getHours()).padStart(2, '0');
		const minutes = String(combinedDateTime.getMinutes()).padStart(2, '0');
		const seconds = String(combinedDateTime.getSeconds()).padStart(2, '0');
		const milliseconds = String(combinedDateTime.getMilliseconds()).padStart(3, '0');
	
		return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
	};

    const handleTesting = async () => {
        console.log('valid from', validFrom);
        console.log('valid to', validTo);
    }
    
    const handleSubmit = async () => {
        const now = new Date();
		now.setHours(0, 0, 0, 0);

        let startDateTime = null;
        const tzOffset = new Date().getTimezoneOffset();

        let localEndDate = new Date(
            validTo.getFullYear(),
            validTo.getMonth(),
            validTo.getDate(),
            endTime.getHours(),
            endTime.getMinutes()
        );

        if(includeTime){
            let localStartDate = new Date(
                validFrom.getFullYear(),
                validFrom.getMonth(),
                validFrom.getDate(),
                startTime.getHours(),
                startTime.getMinutes()
            );

             localStartDate = new Date(localStartDate.getTime() - (tzOffset * 60000));
             startDateTime = localStartDate.toISOString();

        }

        localEndDate = new Date(localEndDate.getTime() - (tzOffset * 60000));
        let endDateTime = localEndDate.toISOString();
            
        
        // Validation checks
        if (postType === 'Offer' && !code) {
            setAlertMessage("Offer code is required.");
            setAlertVisible(true);
            return;
        }
        if (!heading) {
            setAlertMessage("Heading is required.");
            setAlertVisible(true);
            return;
        }
        if (!description) {
            setAlertMessage("Description is required.");
            setAlertVisible(true);
            return;
        }


        if (startDateTime) {
			const validFromDate = new Date(startDateTime);
			validFromDate.setHours(0, 0, 0, 0); // Reset time to the start of the day
	
			if (validFromDate < now) {
				setAlertMessage("Valid From date cannot be in the past");
                setAlertVisible(true);
                return;
			}
		}


        if (endDateTime) {
			const validToDate = new Date(endDateTime);
			validToDate.setHours(0, 0, 0, 0); // Reset time to the start of the day
	
			if (validToDate < now) {
                setAlertMessage("Valid To date cannot be in the past");
                setAlertVisible(true);
                return;
			}
	
			if (startDateTime) {
				const validFromDate = new Date(startDateTime);
				validFromDate.setHours(0, 0, 0, 0);
	
				if (validToDate < validFromDate) {
                    setAlertMessage("Valid To date must be after or equal to Valid From date");
                    setAlertVisible(true);
                    return;
				}
			}
		}
    
        setSubmitLoading(true);
        
        try {
        
            let downloadImageUrl = null;
            if(imageUrl !== null){
                downloadImageUrl = await uploadImageToFirebase(imageUrl);
            }

            const newAnnouncement = {
                code: code,
                description,
                expired_date_start:startDateTime,
                expired_date_end:endDateTime,
                image_url: downloadImageUrl,
                notification_urgency: notificationUrgency,
                post_type: postType,
                push_notification: pushNotification,
                title: heading,
                youtube_url: ytLinks,
                additionalLinks: links,
            };

            let action = 'create';
            let announcementId;
            let announcementDescription = '';
            if(isEditMode){
                action = 'edit';
                // @ts-ignore
                    const announcementRef = doc(firestore, 'announcement_dev', route.params.id);
                    const editAnnouncementRef = updateDoc(announcementRef, {
                        ...newAnnouncement,
                        last_updated: new Date().toISOString(),
                        updated_by: userDetails.uid
                    });

                    // @ts-ignore
                    announcementId = route.params.id;
                    announcementDescription = `Edited Announcement: 
                    Title: ${heading},
                    Code: ${code || "N/A"},
                    Description: ${description},
                    Expiration Start: ${startDateTime || "N/A"},
                    Expiration End: ${endDateTime || "N/A"},
                    Post Type: ${postType},
                    Notification Urgency: ${notificationUrgency},
                    Push Notification: ${pushNotification},
                    YouTube URL: ${ytLinks || "N/A"},
                    Additional Links: ${links || "N/A"}`;

                    setAlertMessage('Announcement updated successfully');
            }else{
                const announcementNo = generateAnnouncementNo();
                const newAnnouncementRef =  await addDoc(collection(firestore, 'announcement_dev'), {
                    ...newAnnouncement,
                    added_date: new Date().toISOString(),
                    announcement_no: announcementNo,
                    added_user: userDetails.uid
                });

                
                announcementId = newAnnouncementRef.id;

                announcementDescription = `Created Announcement: 
                Title: ${heading},
                Code: ${code || "N/A"},
                Description: ${description},
                Expiration Start: ${startDateTime || "N/A"},
                Expiration End: ${endDateTime || "N/A"},
                Post Type: ${postType},
                Notification Urgency: ${notificationUrgency},
                Push Notification: ${pushNotification},
                YouTube URL: ${ytLinks || "N/A"},
                Additional Links: ${links || "N/A"}`;

                setAlertMessage('Announcement created successfully');
            }


            const activityLog = {
                act_id: announcementId,
                action,
                action_time: new Date().toISOString(),
                description: announcementDescription,
                module: 'announcement',
                uid: userDetails.uid
            };
        
            await addDoc(collection(firestore, 'admin_user_activity'), activityLog);


            setAlertVisible(true);
            clearFields();
            setIsEditMode(false);

            // Send notification
            if (pushNotification) {
                const announcementNotificationData = {
                    postType: newAnnouncement.post_type, 
                    title: newAnnouncement.title,       
                    description: newAnnouncement.description, 
                    notificationUrgency: newAnnouncement.notification_urgency, 
                    announcementNo: announcementId,
                    uid:user.id,
                    postId:announcementId 
                  }
                await sendPushNotification(announcementNotificationData);
            }



            // Navigate back after short delay
            setTimeout(() => { router.back(); }, 2000);

        } catch (error) {
            console.error('Error saving announcement: ', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const clearEditMode = () => {
        setIsEditMode(false);
        router.push('/Post');
    }
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
           setValidTo(selectedDate);
        }
    };

    const validFromDateChange = (event, selectedDate) => {
        setShowValidFromDatePicker(false);
        if (selectedDate) {
           setValidFrom(selectedDate);
        }
    };

    const validToDateChange = (event, selectedDate) => {
        setShowValidToDatePicker(false);
        if (selectedDate) {
            setValidTo(selectedDate);
         }
    };

    const clearImage = () => {
        setImageUrl(null); // Clear the image
    };

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setExpiredTime(selectedTime);
        }
    };

    const handleIncludeTimeSwitch = () => {
        setIncludeTime(!includeTime);
    };
    const clearFields = () => {
        setPostType('Offer');
        setHeading('');
        setCode('');
        setDescription('');
        setImageUrl(null);
        setYTLinks('');
        setLinks('');
        setPushNotification(true);
        setNotificationUrgency('Medium');
        setExpiredDate(new Date());
    };
    // Function to send notifications to users
    const sendPushNotification = async (announcement) => {
        console.log(announcement);
         const result = await sendPushNotificationToAllUsers(announcement);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.headerLabelSection}>{isEditMode ? 'Edit Announcement' : 'Create Announcement'}</Text>
            <Text style={styles.label}>Heading</Text>
            <TextInput
                value={heading}
                onChangeText={setHeading}
                style={styles.headingInput}
                placeholder="Enter the announcement heading"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, {
                    height: 320 ,
                    textAlign: 'left',
                    textAlignVertical: 'top',
                    paddingTop:20

                }]} // Wider description input
                multiline
                placeholder="Enter the announcement details"
            />
            <Text style={styles.label}>Post Type</Text>
            {/* <View style={styles.pickerWrapper}> */}
                {/* <Picker
                    selectedValue={postType}
                    onValueChange={(value) => setPostType(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="Offer" value="Offer" />
                    <Picker.Item label="General" value="General" />
                    <Picker.Item label="Urgent" value="Urgent" />
                </Picker> */}
                {/* <Picker
                 selectedValue={postType}
                 onValueChange={(value) => setPostType(value)}
                 style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                >
                    <Picker.Item label="Offer" value="Offer" />
                    <Picker.Item label="General" value="General" />
                    <Picker.Item label="Urgent" value="Urgent" />
                </Picker> */}
               <Text> {Platform.OS}</Text>
                {Platform.OS === 'ios' ? (
                    <>
                        <TouchableOpacity
                        style={styles.pickerWrapper}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.pickerText}>{postType || 'Select Post Type'}</Text>
                        </TouchableOpacity>
                    <Modal
                        visible={modalVisible}
                        transparent={true}
                        animationType="slide"
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Picker
                                    selectedValue={postType}
                                    onValueChange={(value) => {
                                        setPostType(value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Picker.Item label="Offer" value="Offer" />
                                    <Picker.Item label="General" value="General" />
                                    <Picker.Item label="Urgent" value="Urgent" />
                                </Picker>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </>
            ) : (
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={postType}
                        onValueChange={(value) => setPostType(value)}
                        style={styles.picker}
                        mode="dropdown"
                    >
                        <Picker.Item label="Offer" value="Offer" />
                        <Picker.Item label="General" value="General" />
                        <Picker.Item label="Urgent" value="Urgent" />
                    </Picker>
                </View>
            )}
            {/* </View> */}
            {postType === 'Offer' && (
                <>
                    <Text style={styles.label}>Offer Code</Text>
                    <View style={styles.fieldWrapper}>
                        <Feather name="tag" size={20} color="#333" />
                        <TextInput
                            value={code}
                            onChangeText={setCode}
                            style={styles.fieldInput}
                            placeholder="Offer Code"
                        />
                    </View>
                </>
            )}

            <Text style={styles.label}>Youtube Links</Text>
            <View style={styles.fieldWrapper}>
                <Feather name="youtube" size={20} color="#333" />
                <TextInput
                    value={ytLinks}
                    onChangeText={setYTLinks}
                    style={styles.fieldInput}
                    placeholder="Add any YT links"
                />
            </View>

            <Text style={styles.label}>Links</Text>
            <View style={styles.fieldWrapper}>
                <Feather name="link" size={20} color="#333" />
                <TextInput
                    value={links}
                    onChangeText={setLinks}
                    style={styles.fieldInput}
                    placeholder="Add any related links"
                />
            </View>

            <Text style={styles.label}>Image</Text>
            {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
            <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Feather name="image" size={20} color="#fff" />
                <Text style={styles.buttonText}>Pick an image</Text>
            </TouchableOpacity>

            {imageUrl && (
                <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
                    <Feather name="x-circle" size={20} color="#FF0000" />
                    <Text style={styles.clearButtonText}>Clear Image</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.label}>Push Notification</Text>
            <Switch
                value={pushNotification}
                onValueChange={setPushNotification}
            />

            <Text style={styles.label}>Notification Importance</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={notificationUrgency}
                    onValueChange={(value) => setNotificationUrgency(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="Low" value="Low" />
                    <Picker.Item label="Medium" value="Medium" />
                    <Picker.Item label="High" value="High" />
                    <Picker.Item label="Urgent" value="Urgent" />
                </Picker>
            </View>

        

            {!includeTime && ( // Fixed condition
                <>
                    <Text style={styles.label}>Valid To</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
                            <Feather name="calendar" size={20} color="#000" />
                                <Text style={styles.dateText}>{validTo.toDateString()}</Text>
                        </TouchableOpacity>


                    {showDatePicker && (
                        <DateTimePicker
                            value={validTo}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                </>
            )}


        
            {/* Switch for including time */}
            <View style={styles.switchContainer}>
                <Text style={styles.label}>Include specific time</Text>
                <Switch
                    value={includeTime}
                    onValueChange={handleIncludeTimeSwitch}
                />
            </View>

            {includeTime && (
                <>
                    <Text style={styles.label}>Validate From</Text>
                        <TouchableOpacity onPress={() => setShowValidFromDatePicker(true)} style={styles.datePicker}>
                            <Feather name="calendar" size={20} color="#000" />
                                <Text style={styles.dateText}>{validFrom.toDateString()}</Text>
                        </TouchableOpacity>


                    {showValidFromDatePicker && (
                        <DateTimePicker
                            value={validFrom}
                            mode="date"
                            display="default"
                            onChange={validFromDateChange}
                        />
                    )}

                    <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={styles.datePicker}>
                        <Feather name="clock" size={20} color="#000" />
                        <Text style={styles.dateText}>
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Validate To</Text>
                        <TouchableOpacity onPress={() => setShowValidToDatePicker(true)} style={styles.datePicker}>
                            <Feather name="calendar" size={20} color="#000" />
                                <Text style={styles.dateText}>{validTo.toDateString()}</Text>
                        </TouchableOpacity>


                    {showValidToDatePicker && (
                        <DateTimePicker
                            value={validTo}
                            mode="date"
                            display="default"
                            onChange={validToDateChange}
                        />
                    )}

                    {showStartTimePicker && (
                        <DateTimePicker
                            value={startTime}
                            mode="time"
                            is24Hour={true}
                            display="spinner"
                            onChange={(event, selectedTime) => {
                                setShowStartTimePicker(false);
                                if (selectedTime) setStartTime(selectedTime);
                            }}
                        />
                    )}
                    <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.datePicker}>
                        <Feather name="clock" size={20} color="#000" />
                        <Text style={styles.dateText}>
                            {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>

                    {showEndTimePicker && (
                        <DateTimePicker
                            value={endTime}
                            mode="time"
                            is24Hour={true}
                            display="spinner"
                            onChange={(event, selectedTime) => {
                                setShowEndTimePicker(false);
                                if (selectedTime) setEndTime(selectedTime);
                            }}
                        />
                    )}
                </>
            )}

         


            <TouchableOpacity   style={styles.postButton}
                                onPress={handleSubmit}>

                {submitLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.postButtonText}>Create Announcement</Text>

                )}
            </TouchableOpacity>

            {isEditMode ? (
                <TouchableOpacity
                    onPress={() => clearEditMode()}
                    style={styles.borderedButton}
                >
                    <Text style={styles.borderedButtonText}>Switch to insert mode</Text>
                </TouchableOpacity>
            ) : (
                <Text> </Text>
            )}

            <CustomAlert
                visible={alertVisible}
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FBFF',
        padding:20,
        marginTop:20
    },
    contentContainer: {
        paddingBottom: 30,
    },
    label: {
        marginBottom: 8,
        fontFamily:'TrajanPro-Bold',
        fontSize:12
    },
    headerLabelSection: {
        marginBottom: 8,
        fontFamily:'TrajanPro-Bold',
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 15,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 16,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    // pickerWrapper: {
    //     borderWidth: 1,
    //     borderColor: '#ccc',
    //     borderRadius: 8,
    //     marginBottom: 16,
    //   //
    //     overflow: 'hidden',
    //     ...Platform.select({
    //         ios: {
    //             zIndex: 10,
    //             backgroundColor: '#fff',
    //         },
    //         android: {
    //          //   elevation: 2,
    //         },
    //     }),
    // },
    // pickerIOS: {
    //     height: 50,
    //     width: '100%',
    //     color: '#000',
    //     zIndex: 10, // For iOS only
    // },
    // pickerAndroid: {
    //     height: 50,
    //     width: '100%',
    //   //  color: '#000',
    //   //  elevation: 2, // For Android only
    // },

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        width: '80%',
        padding: 16,
    },
    closeButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: 'blue',
    },

    headingInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    fieldWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 16,
        padding: 8,
    },
    fieldInput: {
        flex: 1,
        marginLeft: 8,
        height: 40,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#007BFF',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
       fontFamily:'TrajanPro-Bold'
    },
    postButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    postButtonText: {
        color: '#fff',
        fontSize: 12,
        fontFamily:'TrajanPro-Bold'
    },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 8,
        marginBottom: 16,
    },
    dateText: {
        marginLeft: 8,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFCCCC',
        padding: 12,
        borderRadius: 5,
        marginBottom: 12,
    },
    clearButtonText: {
        color: '#FF0000',
        marginLeft: 8,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    borderedButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    borderedButtonText: {
        color: '#ccc',
        fontSize: 13,
        fontFamily:'TrajanPro-Regular'
    },
});
