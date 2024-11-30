import React, {useContext, useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, Image, Dimensions, FlatList, TouchableOpacity, ScrollView, Alert,ActivityIndicator} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { firestore,auth } from '@/firebaseConfig'; // Import Firestore from your config
import {collection, getDocs, onSnapshot, deleteDoc, doc, where, query, addDoc} from 'firebase/firestore'; // Firestore functions
import { LinearGradient } from 'expo-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder'
// @ts-ignore
import noDataImage from '@/assets/images/nodata.png'; // Import your no_data image
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
import Header from '../../components/Header';
import {useRouter} from "expo-router";
import { UserContext } from '@/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/constants/Colors';
import * as Linking from 'expo-linking';
// @ts-ignore
const Index = () => {
    const [posts, setPosts] = useState([]);
    const [expandedPost, setExpandedPost] = useState<string | null>(null);
    const [showVideo, setShowVideo] = useState<{ [key: string]: boolean }>({});
    const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient)
    const { userDetails ,user,expoPushToken,tempTKSt,stepAuth,stepToken, userLoading  } = useContext(UserContext);
    const [readStatus, setReadStatus] = useState<{ [key: string]: boolean }>({});
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const navigation = useNavigation();
   
    // Fetch announcements from Firestore
    const fetchAnnouncements = async () => {
        try {
            const announcementsSnapshot = await getDocs(collection(firestore, 'announcement_dev'));
            const announcementsData = announcementsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            const sortedAnnouncements = announcementsData.sort((a, b) => {
                const dateA = new Date(a.added_date);
                const dateB = new Date(b.added_date);
                return dateB - dateA; // Sort by newest first
            });

            // @ts-ignore
            setPosts(sortedAnnouncements);
        } catch (userDetails) {
            console.error('Error fetching announcements: ', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

        // Fetch read status for the user
        const fetchReadStatus = async () => {
            if (!userDetails?.uid) return;

            const readStatusQuery = query(
                collection(firestore, 'post_read_status'),
                where('user_id', '==', userDetails.uid)
            );

            const readStatusSnapshot = await getDocs(readStatusQuery);
            const statusData = {};
            readStatusSnapshot.forEach((doc) => {
                // @ts-ignore
                statusData[doc.data().post_id] = true; // Mark post as read
            });

            setReadStatus(statusData);
        };

        const markPostAsRead = async (postId) => {
            if (readStatus[postId] || !userDetails?.uid) return; // Skip if already marked as read

            try {
                await addDoc(collection(firestore, 'post_read_status'), {
                    user_id: userDetails.uid,
                    post_id: postId,
                    read_at: new Date(),
                });
                setReadStatus((prevStatus) => ({
                    ...prevStatus,
                    [postId]: true,
                }));
            } catch (error) {
                console.error('Error marking post as read: ', error);
            }
        };

        const onViewableItemsChanged = useCallback(({ viewableItems }) => {
            viewableItems.forEach((viewableItem) => {
                markPostAsRead(viewableItem.item.id);
            });
        }, [readStatus]);

        const viewabilityConfig = {
            itemVisiblePercentThreshold: 50,
        };


        


    useEffect(() => {

        fetchAnnouncements();
        const unsubscribe = onSnapshot(collection(firestore, 'announcement_dev'), (snapshot) => {
            const announcementsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            const sortedAnnouncements = announcementsData.sort((a, b) => {
                // @ts-ignore
                const dateA = new Date(a.added_date);
                // @ts-ignore
                const dateB = new Date(b.added_date);
                // @ts-ignore
                return dateB - dateA; // Descending order
            });

            // @ts-ignore
            setPosts(sortedAnnouncements);
            setLoading(false);
            cleanupExpiredPosts();

        }, (error) => {
            setLoading(false);
        });

        // Update time differences every minute
        const intervalId = setInterval(() => {
            setPosts((prevPosts) => [...prevPosts]); // Trigger re-render
        }, 60000); // 60000ms = 1 minute

        // Cleanup the subscription and interval on unmount
        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, []);

    const cleanupExpiredPosts = async () => {
        try {
          const currentDate = new Date();
      
          // Loop through all posts
          for (const post of posts) {
            const expiredDate = post.expired_date_end ? new Date(post.expired_date_end) : null;
            
            if (expiredDate) {
              const daysSinceExpired = Math.floor((currentDate - expiredDate) / (1000 * 60 * 60 * 24)); // Calculate days
              console.log('is expired', daysSinceExpired);
              
              if (daysSinceExpired > 30) {
                // Delete post from Firestore
                await deleteDoc(doc(firestore, 'announcement_dev', post.id));
                console.log(`Deleted post: ${post.id} expired ${daysSinceExpired} days ago`);
              }
            }
          }
        } catch (error) {
          console.error('Error cleaning up expired posts:', error);
        }
    };

    const toggleDescription = (postId: string) => {
        setExpandedPost(expandedPost === postId ? null : postId);
    };

    const toggleVideo = (postId: string) => {
        setShowVideo((prev) => ({ ...prev, [postId]: !prev[postId] }));
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnnouncements(); // Re-fetch data when the user pulls to refresh
    };
  

    const isDefaultTime = (date) => {
        const time = date.toISOString().substring(11, 19); // Extract the time portion in 'HH:MM:SS' format
        return time === '07:22:00' || time === '00:00:00'; // Adjust this based on what the default time is
    };

    const formatDateTime = (dateInput, onlyDate = false) => {
        // Ensure we have a valid date
        if (!dateInput) return 'Invalid Date';
        
        // Convert to Date object if it's not already
        const originalDate = dateInput instanceof Date ? dateInput : new Date(dateInput);
        
        // Create a date object that preserves the original time without UTC conversion
        const date = new Date(
            originalDate.getUTCFullYear(),
            originalDate.getUTCMonth(),
            originalDate.getUTCDate(),
            originalDate.getUTCHours(),
            originalDate.getUTCMinutes()
        );
    
        // Format the date
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString(undefined, options);
    
        if (onlyDate) {
            return formattedDate;
        }
    
        // Custom time formatting to ensure consistent display
        const formatTime = (date) => {
            let hours = date.getHours();
            let minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            // Convert to 12-hour format
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? `0${minutes}` : minutes;
            
            return `${hours}:${minutes} ${ampm}`;
        };
    
        const formattedTime = formatTime(date);
        return `${formattedDate} at ${formattedTime}`;
    };

    const getDateWithoutTime = (date) => {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    };
    const getLocalDate = (date) => {
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate;
    };

    const getExactDateOnly = (dateString) => {
        const date = new Date(dateString); // Parse the timestamp
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getUTCDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
    };


    const filteredPosts = posts.filter((post) => {

        const startDate = post.expired_date_start ? new Date(post.expired_date_start) : null;
        const endDate = post.expired_date_end ? new Date(post.expired_date_end) : null;
        const expiredDate = post.expired_date_end ? new Date(post.expired_date_end) : null;

        const currentDate = new Date();
        const currentDateLocal = getLocalDate(currentDate);
        
        if (startDate && endDate) {
            if (activeTab === 'active') {
                return currentDateLocal >= startDate && currentDateLocal <= endDate;
            } else {
                return currentDateLocal > endDate;
            }
        }

        if (expiredDate) {

            const expiredDateWithoutTime = getExactDateOnly(expiredDate);
            const currentDateWithoutTime = getExactDateOnly(currentDateLocal);

            if (activeTab === 'active') {
                return expiredDateWithoutTime >= currentDateWithoutTime;
            } else {
                return expiredDateWithoutTime < currentDateWithoutTime;
            }
        }
        return activeTab === 'active';
    });



    const getTimeDifference = (timestamp) => {
        const currentTime = new Date();
        const postTime = timestamp.seconds
            ? new Date(timestamp.seconds * 1000) // Firestore timestamp
            : new Date(timestamp);              // ISO string or regular date

        if (isNaN(postTime.getTime())) {
            return 'Invalid Date'; // Handle invalid dates
        }

        const timeDiff = currentTime - postTime; // Difference in milliseconds
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (minutes < 1) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else if (days < 7) { // Less than a week ago
            return `${days} day${days === 1 ? '' : 's'} ago`;
        } else { // More than a week ago, show the full date
            return postTime.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
    };

    const openLink = (url) => {
        if (url) {
            Linking.canOpenURL(url)
                .then((supported) => {
                    if (supported) {
                        Linking.openURL(url);
                    } else {
                        Alert.alert('Error', 'Invalid link provided.');
                    }
                })
                .catch((err) => Alert.alert('Error', `Unable to open link: ${err.message}`));
        } else {
            Alert.alert('Error', 'No link provided.');
        }
    }

    const editPost = (item) => {
        // @ts-ignore
        navigation.navigate('Post', {
            ...item,
            editMode: true,
        });
    };

    const deletePost = (postId) => {
        Alert.alert(
            'Delete Post',
            'Do you really want to delete this post?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        setIsDeleting(true); // Show loading indicator

                        try {
                            // Delete the post from Firestore
                            await deleteDoc(doc(firestore, 'announcement_dev', postId.id));

                            // Show success message
                            Alert.alert('Success', 'The post has been successfully deleted.');

                            // Remove the post from the state to refresh the feed
                            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId.id));

                            // Optionally, re-fetch announcements to ensure the feed is updated
                            await fetchAnnouncements(); // Assuming fetchAnnouncements is the function to refresh the feed
                        } catch (error) {
                            console.error('Error deleting post:', error);
                            Alert.alert('Error', 'There was an error deleting the post. Please try again.');
                        } finally {
                            setIsDeleting(false); // Hide loading indicator after process
                        }
                    },
                    style: 'destructive', // Make the 'Yes' button red
                },
            ],
            { cancelable: true }
        );
    };


    const extractYoutubeUrl = (iframeString) => {
        const srcMatch = iframeString.match(/src="([^"]+)"/);
        return srcMatch ? srcMatch[1] : null;
    };

    const renderItem = ({ item }: { item: typeof posts[0] }) => {
        const isExpanded = expandedPost === item.id;
        const shortDescription = item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description;

        const startDate = item.expired_date_start ? new Date(item.expired_date_start) : null;
        const endDate = item.expired_date_end ? new Date(item.expired_date_end) : null;

        // Convert Firestore Timestamp to a Date object
        const formattedDate = item.added_date
            ? getTimeDifference(item.added_date)
            : 'No Date';  // Fallback if date is not present

        // @ts-ignore
        // @ts-ignore
        return (
            <View style={[styles.postCard, { width: screenWidth }]}>
                <View style={styles.postHeader}>
                    <View style={styles.postHeaderLeft}>
                        <Feather name="calendar" size={14} color="#999" />
                        <Text style={styles.postDate}>{formattedDate}</Text>
                    </View>


                    <View style={styles.postHeaderRight}>
                        {item.post_type === 'Offer' && (
                            <Text style={styles.postCode}>
                                <Feather name="book-open" size={12} color="#fff" /> {item.code}
                            </Text>
                        )}
                        <Text
                            style={[
                                styles.postLabel,
                                item.post_type === 'General' && { backgroundColor: 'blue' },   // Blue for General
                                item.post_type === 'Urgent' && { backgroundColor: 'red' },     // Red for Urgent
                                item.post_type === 'Offer' && { backgroundColor: '#FF6347' }   // FF6347 for Offer
                            ]}
                        >
                            <Feather name="tag" size={12} color="#fff" /> {item.post_type}
                        </Text>
                    </View>


                </View>
                <View style={styles.postTopSection}>
                    <Text style={styles.postTitle}>{item.title}</Text>

                    {startDate && endDate && startDate.getTime() === endDate.getTime() && isDefaultTime(startDate) ? (
                        <Text style={styles.expiryInfo}>
                            Expires on {formatDateTime(startDate, true)} {/* Show only the date */}
                        </Text>
                    ) : startDate && endDate ? (
                        <Text style={styles.expiryInfo}>
                            Valid from {formatDateTime(startDate)} to {formatDateTime(endDate)}
                        </Text>
                    ) : (
                        <Text style={styles.expiryInfo}>
                            Expires on {formatDateTime(new Date(item.expired_date_end), true)}
                        </Text>
                    )}
                </View>
                <View style={styles.postCaption}>
                    <Text style={styles.postDescription}>
                        {isExpanded ? item.description : shortDescription}
                    </Text>
                    <TouchableOpacity onPress={() => toggleDescription(item.id)}>
                        <Text style={styles.toggleText}>
                            {isExpanded ? 'See Less' : 'See More'}
                        </Text>
                    </TouchableOpacity>

                </View>


                {item.image_url && (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />
                )}

                {item.youtube_url && (
                    <TouchableOpacity onPress={() => toggleVideo(item.id)} style={styles.videoToggleButton}>
                        <Feather name="video" size={16} color="#007BFF" />
                        <Text style={styles.videoToggleText}>
                            {showVideo[item.id] ? 'Hide Video' : 'Watch Video'}
                        </Text>
                    </TouchableOpacity>
                )}

                {item.youtube_url && showVideo[item.id] && (
                    <WebView
                        style={styles.youtubeVideo}
                        source={{ uri: extractYoutubeUrl(item.youtube_url) }}
                        allowsFullscreenVideo={true}
                    />
                )}

                {item.additionalLinks  && (
                    <TouchableOpacity style={styles.videoToggleButton}  onPress={() => openLink(item.additionalLinks)}>
                        <Feather name="link" size={16} color="#007BFF" />
                        <Text style={styles.additionalLinkText}>
                            {item.additionalLinks}
                        </Text>
                    </TouchableOpacity>
                )}
                {userDetails?.uid === item.added_user  && (
                    <View style={styles.actionBar}>
                        <TouchableOpacity onPress={() => editPost(item)}>
                            <Feather name="edit" size={15} color="#fff" style={styles.actionIcon} />
                            <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deletePost(item)}>
                            <Feather name="trash" size={15} color="#fff" style={styles.actionIcon} />
                            <Text style={styles.actionText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {isDeleting &&
                    <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>}
            </View>
        );
    };


    const renderSkeleton = () => (
        <View  style={[styles.postCard, { width: screenWidth }]}>
            <View style={styles.postHeader}>
                <View style={styles.postHeaderLeft}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.skeletonDate}
                    />
                </View>
                <View style={styles.postHeaderRight}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.skeletonCode}
                    />
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.skeletonLabel}
                    />
                </View>
            </View>

            <View style={styles.postCaption}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.skeletonTitle}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.skeletonDescription}
                />
            </View>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.skeletonImage}
            />
        </View>
    );


    // @ts-ignore
    return (

        <FlatList
            data={filteredPosts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged} // Track viewable items to mark as read
            viewabilityConfig={viewabilityConfig}
            refreshing={refreshing}
            onRefresh={fetchAnnouncements}
            ListHeaderComponent={
                <>
                <Header/>
              
                <View style={styles.tabContainer}>
                    
                
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                        onPress={() => setActiveTab('active')}>
                        <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                            Active Offers
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
                        onPress={() => setActiveTab('expired')}>
                        <Text style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}>
                            Expired Offers
                        </Text>
                    </TouchableOpacity>
                </View>
                </>
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={loading ?
                renderSkeleton :
                <View style={styles.noDataContainer}>
                    <Image source={noDataImage} style={styles.noDataImage} />
                    <Text style={styles.noDataText}>No data available</Text>
                </View>

            }
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#F9FBFF',
        backgroundColor: '#F9FBFF',
        paddingBottom: 10,
        padding:20,
        marginTop:20
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 1,  // Reduced padding for smaller height
        backgroundColor: '#fff',
        marginTop: 10,
        borderRadius: 20,
        marginHorizontal: 10,
        elevation: 2,
    },
    postTopSection: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    tab: {
        paddingVertical: 5,  // Reduced padding for smaller height
        flex: 1,
        alignItems: 'center',
        borderRadius: 20,
        marginHorizontal: 5,
    },
    activeTab: {
        backgroundColor:Colors.spaCeylonPrimary,
    },
    tabText: {
        fontSize: 12,
        color: '#dadada',
        fontFamily:"TrajanPro-Bold"
    },
    activeTabText: {
        color: '#fff', // White color for active tab
    },
    listContainer: {
        flexGrow: 1,
    },
    postCard: {
        backgroundColor: '#fff',
        marginBottom: 20,
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
        elevation: 4,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    postHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postDate: {
        fontSize: 14,
        color: '#999',
        marginLeft: 8,
        fontFamily:"notoSans",
    },
    postLabel: {
        backgroundColor: '#FF6347',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
        fontSize: 10,
        fontFamily:"TrajanPro-Bold",
        textTransform:"uppercase"
    },
    postCode: {
        backgroundColor: '#04d81d',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
        fontSize: 10,
        fontFamily:"TrajanPro-Bold",
        textTransform: 'uppercase'
    },
    postCaption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    postTitle: {
        fontSize: 13,
        marginBottom: 5,
        color: '#333',
        fontFamily:"TrajanPro-Bold",
    },
    expiryInfo: {
        fontSize: 10,
        color: '#666',
        fontFamily:"TrajanPro-Regular",
    },
    postDescription: {
        fontSize: 11,
        color: '#555',
        lineHeight: 24,
        textAlign:"justify",
        fontFamily:"TrajanPro-Regular"
    },
    postImage: {
        width: screenWidth,
        height: screenHeight * 0.6,
    },
    videoToggleButton: {
        marginVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    videoToggleText: {
        color: '#007BFF',
        fontSize: 12,
        marginLeft: 8,
        fontFamily:"TrajanPro-Bold"
    },
    additionalLinkText: {
        color: '#007BFF',
        fontSize: 10,
        marginLeft: 8,
        fontFamily:"TrajanPro-Regular"
    },
    youtubeVideo: {
        width: screenWidth,
        height: screenHeight * 0.3,
        marginTop: 10,
    },
    toggleText: {
        color: '#007BFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 18,
        color: '#999',
    },
    skeletonDate: {
        width: 80,
        height: 10,
        borderRadius: 4,
    },
    skeletonCode: {
        width: 60,
        height: 10,
        borderRadius: 4,
        marginLeft: 8,
    },
    skeletonLabel: {
        width: 70,
        height: 10,
        borderRadius: 4,
        marginLeft: 8,
    },
    skeletonTitle: {
        width: '80%',
        height: 20,
        borderRadius: 4,
        marginBottom: 10,
    },
    skeletonDescription: {
        width: '100%',
        height: 15,
        borderRadius: 4,
        marginBottom: 10,
    },
    skeletonImage: {
        width: '100%',
        height: screenHeight * 0.6,
        borderRadius: 4,
        marginTop: 10,
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
    noDataText: {
        marginTop: 10,
        fontSize: 12,
        color: '#999',
        opacity: 0.8,
        fontFamily:'TrajanPro-Regular'
    },
    actionBar: {
        position: 'relative',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Transparent background like TikTok
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 2,
    },
    actionIcon: {
        textAlign: 'center',
    },
    actionText: {
        color: '#fff',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
        fontFamily:'TrajanPro-Bold'
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent dark background
        zIndex: 1000, // Ensure the overlay is on top of other content
    },
});

export default Index;
