import React, {useContext, useState,useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import {firestore, storage, } from "@/firebaseConfig";
import {
    addDoc,
    collection,
    onSnapshot,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    deleteDoc
} from "firebase/firestore";
import {UserContext} from '@/context/UserContext';
import CustomAlert from "@/scripts/CustomAlert";
// @ts-ignore
import noDataImage from "@/assets/images/nodata.png";
import { Colors } from '@/constants/Colors';

export default function Sales() {
    const [selectedTab, setSelectedTab] = useState('Sales');
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [goalEditMode, setGoalEditMode] = useState(false);
    const [title, setTitle] = useState('');
    const [quantity, setQuantity] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [savedGoal, setSavedGoal] = useState(null);
    const [docId, setDocId] = useState(null);
    const [saleAmountId, setSaleAmountId] = useState(null);
    const [totalSaleAmount, setTotalSalesAmount] = useState(null);
    const [remainingBalance, setRemainingBalance] = useState(0); // Store remaining balance
    const [salePrice, setSalePrice] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVisible, setAlertVisible] = useState(false);
    const [saleAmountEditMode, setSaleAmountEditMode] = useState(false);
    const [isLoading , setIsLoading] = useState(false);
    const [isLoadSaveGoal , setIsLoadSaveGoal] = useState(false);
    const [sales, setSales] = useState([]); // Store fetched sales
    const { userDetails ,user } = useContext(UserContext);

    // @ts-ignore
    // @ts-ignore

    useEffect(() => {
        const fetchSalesGoal = async () => {
            const q = query(collection(firestore, 'salesGoals'), where('userId', '==', userDetails.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const goals = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                if (goals.length > 0) {
                    const savedGoal = goals[0];
                    // @ts-ignore
                    setSavedGoal(savedGoal); // Save the goal data
                    // @ts-ignore
                    setDocId(savedGoal.id);

                    // Check if the current date exceeds the goal's end date
                    const currentDate = new Date();
                    // @ts-ignore
                    const goalEndDate = new Date(savedGoal.endDate);

                    if (currentDate > goalEndDate) {
                        // Goal is expired, allow entering a new goal
                        setGoalEditMode(false);
                        setModalVisible(true); 
                    } else {
                        // Goal is still active, only allow editing
                        setGoalEditMode(true);
                        setModalVisible(false);
                    }
                } else {
                    // No goal found, allow entering a new goal
                    setGoalEditMode(false);
                    setModalVisible(true);
                }
            });
            return () => unsubscribe();
        };
        fetchSalesGoal();
    }, [userDetails]);

    useEffect(() => {
        fetchSalesForGoal(); // Fetch sales when the component is loaded or when sales are updated
    }, [docId]);




    const handleSaveGoal = async () => {
        const goalData = {
            goalAmount: goal,
            startDate: convertToISODate(startDate.toLocaleDateString()), // Convert to ISO string
            endDate: convertToISODate(endDate.toLocaleDateString()), // Convert to ISO string
            userId: userDetails.uid,
        };
        setIsLoadSaveGoal(true);
        if (goalEditMode) {
            // @ts-ignore
            const goalRef = doc(firestore, 'salesGoals', docId); // Use docId to update
            await updateDoc(goalRef, goalData);
        } else {
            // Create new goal in Firebase
            await addDoc(collection(firestore, 'salesGoals'), {
                ...goalData,
                added_date: new Date().toISOString(),
                added_user: userDetails.uid
            });
        }

        // Reset the modal and form
        setModalVisible(false);
    
        setGoal('');
        setStartDate(new Date());
        setEndDate(new Date());
        setIsLoadSaveGoal(false);
        

    };

    const handleEditGoal = async () => {
        try {
            // Query the Firestore collection 'salesGoals' where the 'added_user' matches the current user's UID
            const q = query(collection(firestore, 'salesGoals'), where('added_user', '==', userDetails.uid));
            const querySnapshot = await getDocs(q);

            // Check if there's any document for the user
            if (!querySnapshot.empty) {
                const goalDoc = querySnapshot.docs[0];
                const goalData = goalDoc.data();

                // @ts-ignore
                // Populate the form with the goal data for editing
                setGoal(goalData.goalAmount);
                setStartDate(new Date(goalData.startDate)); 
                setEndDate(new Date(goalData.endDate));
                setGoalEditMode(true);
                setModalVisible(true);
            } else {
                console.log('No sales goal found for the user.');
            }
        } catch (error) {
            console.error('Error fetching sales goal for edit:', error);
        }
    };

    function convertToISODate(dateStr) {
        // Assuming the dateStr is in DD/MM/YYYY format
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`).toISOString();
    }

    function convertToDisplayDate(isoDateStr) {
        const date = new Date(isoDateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }


    const fetchSalesForGoal = async () => {
        console.log('sale fetching');
        console.log(docId);
        try {
            if (!docId) return;

            const q = query(collection(firestore, 'salesAmounts'), where('goalId', '==', docId));
            const querySnapshot = await getDocs(q);
            let totalSales = 0;
           
            const fetchedSales = querySnapshot.docs.map((doc) => {
                const sale = doc.data();
                totalSales += sale.goalAmount; // Add the sale amount to totalSales
                return {
                    id: doc.id,
                    ...sale,
                };
            });

            // @ts-ignore
            setSales(fetchedSales); // Update sales state
            // @ts-ignore
            setTotalSalesAmount(totalSales);

            // @ts-ignore
            console.log('save goal is ', savedGoal);
            if (savedGoal && savedGoal.goalAmount) {
                const remaining = savedGoal.goalAmount - totalSales;
                setRemainingBalance(remaining); // Store the remaining balance
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        }
    };

    const handleEditSale = (saleId) => {
        // Show confirmation dialog
        Alert.alert(
            "Edit Sale",
            "Do you want to edit this sale record?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Yes",
                    onPress: async () => {
                        try {
                            // Fetch the specific sale document from Firestore
                            const saleRef = doc(firestore, 'salesAmounts', saleId);
                            const saleSnap = await getDoc(saleRef);

                            if (saleSnap.exists()) {
                                const saleData = saleSnap.data();

                                const saleCost = saleData.goalAmount;
                                const saleQuantity = saleData.quantity;
                                const perSaleCost = saleCost / saleQuantity;
                                console.log(perSaleCost);

                                // @ts-ignore
                                setSalePrice(perSaleCost.toString());
                                setTitle(saleData.title);
                                setQuantity(saleQuantity.toString());
                                setStartDate(new Date(saleData.date)); 
                                setEditMode(true);
                                setSaleAmountId(saleId);
                                console.log(salePrice);
                                setSaleAmountEditMode(true);
                              
                                setSelectedTab('Sales');
                            } else {
                                console.log('No such document!');
                            }
                        } catch (error) {
                            console.error('Error fetching sale:', error);
                        }
                    }
                }
            ]
        );
    };


    const deleteSaleAmount = (saleId) => {
        Alert.alert(
            'Delete Post',
            'Do you really want to delete this record?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            // Delete the post from Firestore
                            await deleteDoc(doc(firestore, 'salesAmounts', saleId));
                            // Show success message
                            Alert.alert('Success', 'The post has been successfully deleted.');
                            fetchSalesForGoal();
                        } catch (error) {
                            console.error('Error deleting post:', error);
                            Alert.alert('Error', 'There was an error deleting the post. Please try again.');
                        } finally {
                           // setIsDeleting(false); // Hide loading indicator after process
                        }
                    },
                    style: 'destructive', // Make the 'Yes' button red
                },
            ],
            { cancelable: true }
        );
    };




    const handleSaveSales = async () => {
        if (!salePrice) {
            setAlertMessage('Amount is required');
            setAlertVisible(true);
            return;
        }

        if (!quantity) {
            setAlertMessage('Quantity is required');
            setAlertVisible(true);
            return;
        }

        if (!startDate) {
            setAlertMessage('Please Enter a Valid Date');
            setAlertVisible(true);
            return;
        }

        if(!title){
            setAlertMessage('Please Enter a Title');
            setAlertVisible(true);
            return;
        }

        if (isNaN(quantity) || parseInt(quantity) <= 0) {
            setAlertMessage('Please enter a valid quantity.');
            setAlertVisible(true);
            return;
        }

        if (isNaN(salePrice) || parseFloat(salePrice) <= 0) {
            setAlertMessage('Please enter a valid sale amount.');
            setAlertVisible(true);
            return;
        }


        try {
            setIsLoading(true);

            const totalGoalAmount = salePrice * quantity;
            const salesData = {
                goalAmount: totalGoalAmount,
                title: title,
                goalId: docId,
                quantity: parseInt(quantity),
                date: startDate.toISOString(),
                added_user: userDetails.uid,
            };
            console.log(salesData);

            if (saleAmountEditMode && saleAmountId) {
                // Update the existing sale
                const saleRef = doc(firestore, 'salesAmounts', saleAmountId);
                await updateDoc(saleRef, salesData);

                setAlertMessage('Sales record updated successfully!');
                setEditMode(false);
            } else {
                // Create a new sale
                await addDoc(collection(firestore, 'salesAmounts'), {
                    ...salesData,
                    added_date: new Date().toISOString(), // Only add created date for new records
                });
                setAlertMessage('Sales goal saved successfully!');
            }

            fetchSalesForGoal();
            setAlertVisible(true);
            setIsLoading(false);
            resetForm();
        } catch (error) {
            setAlertMessage('There was an error saving the sale.');
            setAlertVisible(true);
        }
    };

    const resetForm = () => {
        setSalePrice(''); 
        setTitle(''); 
        setQuantity('');
        setStartDate(new Date()); 
        setSaleAmountEditMode(false);
    };

    const renderSalesList = () => {
        return (
            <FlatList
                data={sales} // The data source for the FlatList
                renderItem={({ item }) => (
                    <View style={styles.transaction}>
                        <Feather name={"dollar-sign"} size={30} color="#9b0000" />
                        <View style={styles.transactionDetails}>
                            <Text style={styles.transactionTitle}>{item.title}</Text>
                            <Text style={styles.saleAmount}>Amount: Rs {item.goalAmount}</Text>
                            <Text style={styles.saleDate}>Date: {new Date(item.date).toLocaleDateString()}</Text>
                        </View>
                        {/* Edit and Delete buttons on the right */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity onPress={() => handleEditSale(item.id)} style={styles.editButton}>
                                <Feather name="edit" size={20} color="#9b0000" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteSaleAmount(item.id)} style={styles.deleteButton}>
                                <Feather name="trash-2" size={20} color="red" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                keyExtractor={(item) => item.id} // Ensure each item has a unique key
                contentContainerStyle={styles.salesListContainer}
                ListEmptyComponent={
                    <View style={styles.noDataContainer}>
                        <Image source={noDataImage} style={styles.noDataImage} />
                        <Text style={styles.noDataText}>No data available</Text>
                    </View>
                } // If no data is available
            />
        );
    };

    // @ts-ignore
    // @ts-ignore
    return (
        <View style={styles.container}>
            <Text style={styles.headerLabelSection}>Sales</Text>

            {/* Balance Section */}
            <View style={styles.balanceSection}>
                <View style={styles.balanceHeader}>

                
                    {isLoadSaveGoal ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        savedGoal ? (
                            <View>
                                <Text style={styles.balanceText}>Your Sale Goal</Text>
                                <Text style={styles.balanceAmount}>Rs {savedGoal.goalAmount}</Text>
                                <Text style={styles.saleDateText}>
                                    From {convertToDisplayDate(savedGoal.startDate)} to {convertToDisplayDate(savedGoal.endDate)}
                                </Text>
                                <Text style={styles.remainingBalance}>Remaining Target: {remainingBalance}</Text>
                            </View>
                        ) : (
                            <Text style={styles.noGoalText}>Set Your Monthly Sale Goal</Text>
                        )

                    )}

                </View>

                {!goalEditMode && (
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.plusIcon}>
                        <Feather name="plus-circle" size={30} color="#fff" />
                    </TouchableOpacity>
                )}
                {goalEditMode && (
                    <TouchableOpacity onPress={handleEditGoal} style={styles.editIcon}>
                        <Feather name="edit" size={30} color="#fff" />
                    </TouchableOpacity>
                )}


            </View>

            {/* Tabs and Sort Section */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity onPress={() => setSelectedTab('Sales')} style={selectedTab === 'Sales' ? styles.activeTab : styles.tab}>
                    <Text style={selectedTab === 'Sales' ? styles.activeTabText : styles.tabText}>Sales</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedTab('Earnings')} style={selectedTab === 'Earnings' ? styles.activeTab : styles.tab}>
                    <Text style={selectedTab === 'Earnings' ? styles.activeTabText : styles.tabText}>Earnings</Text>
                </TouchableOpacity>
            </View>
            {/* Conditionally Render Sales Form or Transactions List */}
            {selectedTab === 'Sales'  && docId ? (
                <View style={styles.salesForm}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Sales Amount"
                        keyboardType="numeric"
                        value={salePrice}
                        onChangeText={setSalePrice}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Title"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Quantity"
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={setQuantity}
                    />
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateText}>Select Date: {startDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) setStartDate(selectedDate);
                            }}
                        />
                    )}
               
                    <TouchableOpacity style={styles.customButton} onPress={handleSaveSales}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <View style={styles.iconTextWrapper}>
                                <Feather
                                    name={editMode ? "edit" : "plus-circle"}
                                    size={20}
                                    color="white"
                                    style={styles.iconStyle}
                                />
                                <Text style={styles.buttonText}>
                                    {editMode ? "Update Sale" : "Add Sales"}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>


                </View>
            ) : (
                renderSalesList()
            )}


            {/* Modal for Goal Entry */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.input}
                            placeholder="Set Monthly Goal"
                            keyboardType="numeric"
                            value={goal}
                            onChangeText={setGoal}
                        />
                        <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
                            <Text style={styles.dateText}>Start Date: {startDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowStartDatePicker(false);
                                    if (selectedDate) setStartDate(selectedDate);
                                }}
                            />
                        )}

                        <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
                            <Text style={styles.dateText}>End Date: {endDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showEndDatePicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEndDatePicker(false);
                                    if (selectedDate) setEndDate(selectedDate);
                                }}
                            />
                        )}

                        <View style={styles.buttonContainer}>
                            <Button title="Save" onPress={handleSaveGoal} />
                            <View style={styles.spacer} />
                            <Button title="Close" color="red" onPress={() => setModalVisible(false)} />
                        </View>
                    </View>
                </View>
            </Modal>
            <CustomAlert
                visible={alertVisible}
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FBFF',
        padding: 20,
        marginTop: 20,
    },
    balanceSection: {
       backgroundColor:Colors.spaCeylonPrimary,
        borderRadius: 15,
        padding: 20,
        marginVertical: 20,
        position: 'relative',
    },
    balanceHeader: {
        flexDirection: 'column',
    },
    balanceText: {
        color: '#ffffff90',
        fontSize: 13,
        fontFamily:'TrajanPro-Bold',
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 30,
        fontFamily:'TrajanPro-Bold',
        marginTop: 5,
    },
    remainingBalance: {
        color: '#fff',
        fontFamily:'TrajanPro-Bold',
    },
    plusIcon: {
        position: 'absolute',
        top: 10,
        right: 20,
    },
    editIcon: {
        position: 'absolute',
        top: 60,
        right: 20,
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    activeTab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomWidth: 3,
        borderBottomColor: Colors.spaCeylonPrimary,
    },
    tabText: {
        fontSize: 18,
        color: '#888',
        fontFamily:'TrajanPro-Regular',
    },
    activeTabText: {
        fontSize: 18,
        color: Colors.spaCeylonPrimary,
        fontFamily:'TrajanPro-Bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        width: '100%',
        fontFamily:'TrajanPro-Regular'
    },
    dateButton: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: '#f0f0f0',
        width: '100%',
    },
    dateText: {
        fontSize: 10,
        textAlign: 'left',
        color: '#000000',
        fontFamily:'TrajanPro-Regular',
    },
    saleDateText: {
        fontSize: 10,
        textAlign: 'left',
        color: '#ccc',
        fontFamily:'TrajanPro-Regular',
    },
    headerLabelSection: {
        marginBottom: 8,
        textAlign: 'center',
        fontFamily:'TrajanPro-Bold',
        marginVertical: 10,
        fontSize: 18,
    },
    salesForm: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,

    },
    transactionList: {
        paddingBottom: 20,
    },
    transaction: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        justifyContent: 'space-between',
    },
    transactionDetails: {
        flex: 1,
        marginLeft: 10,
    },
    transactionTitle: {
        fontSize: 16,
        fontFamily:'TrajanPro-Bold',
    },
    saleAmount: {
        fontSize: 16,
        color: '#000',
        marginTop: 5,
        fontFamily:'TrajanPro-Regular',
    },
    saleDate: {
        color: '#888',
        fontSize: 12,
        marginTop: 5,
        fontFamily:'TrajanPro-Regular',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    editButton: {
        marginRight: 10,
    },
    salesListContainer: {
        paddingBottom: 20,
    },
    transactionType: {
        color: '#888',
    },
    transactionAmount: {
        alignItems: 'flex-start',
    },
    noGoalText: {
        color: '#ffffff90',
        fontFamily:'TrajanPro-Regular',
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    spacer: {
        width: 20,
    },
    noDataText: {
        marginTop: 10,
        fontSize: 12,
        color: '#999',
        opacity: 0.8,
        textAlign: 'center',
        fontFamily:'TrajanPro-Regular'
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noDataImage: {
        width: 200,
        height: 200,
        marginBottom: 10,
        opacity: 0.2,
    },
    customButton: {
        flexDirection: 'row', 
        backgroundColor: Colors.spaCeylonPrimary, 
        borderRadius: 25, 
        paddingVertical: 10, 
        paddingHorizontal: 15, 
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
    },
    iconTextWrapper:{
        flexDirection: 'row',
        alignItems: 'center'
    },
    buttonText: {
        color: 'white', 
        fontSize: 16, 
        fontFamily:'TrajanPro-Bold',
        marginLeft: 10,
    },
    iconStyle: {
        marginRight: 10,
    },
});
