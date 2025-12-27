import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Animated,
    TouchableWithoutFeedback,
} from 'react-native';
import { adminAPI, qaAPI } from '../services/api';
import voiceService from '../services/voiceService';

export default function AdminScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'qa'
    const [users, setUsers] = useState([]);
    const [qaPairs, setQAPairs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [isListeningQuestion, setIsListeningQuestion] = useState(false);
    const [isListeningAnswer, setIsListeningAnswer] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(false);
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerHeight = useRef(new Animated.Value(0)).current;
    const hideTimer = useRef(null);

    useEffect(() => {
        loadData();
        return () => {
            voiceService.destroy();
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
            }
        };
    }, [activeTab]);

    // Animate header visibility
    useEffect(() => {
        if (headerVisible) {
            Animated.parallel([
                Animated.timing(headerOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(headerHeight, {
                    toValue: 120,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();

            // Auto-hide after 3 seconds
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
            }
            hideTimer.current = setTimeout(() => {
                setHeaderVisible(false);
            }, 3000);
        } else {
            Animated.parallel([
                Animated.timing(headerOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(headerHeight, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [headerVisible]);

    const handleHeaderHover = () => {
        setHeaderVisible(true);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const [usersRes, statsRes] = await Promise.all([
                    adminAPI.getUsers(),
                    adminAPI.getStats(),
                ]);
                setUsers(usersRes.data.users);
                setStats(statsRes.data.stats);
            } else {
                const qaRes = await qaAPI.getAll();
                setQAPairs(qaRes.data.qaPairs);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUser = async (userId, isActive) => {
        try {
            if (isActive) {
                await adminAPI.deactivateUser(userId);
            } else {
                await adminAPI.activateUser(userId);
            }
            loadData();
        } catch (error) {
            console.error('Error toggling user:', error);
            Alert.alert('Error', 'Failed to update user status');
        }
    };

    const handleVoiceInput = async (field) => {
        const isQuestion = field === 'question';
        const setListening = isQuestion ? setIsListeningQuestion : setIsListeningAnswer;
        const setText = isQuestion ? setNewQuestion : setNewAnswer;

        if ((isQuestion && isListeningQuestion) || (!isQuestion && isListeningAnswer)) {
            await voiceService.stopListening();
            setListening(false);
        } else {
            const started = await voiceService.startListening(
                'en-US',
                (text) => {
                    setText(text);
                    setListening(false);
                },
                (error) => {
                    Alert.alert('Voice Error', error);
                    setListening(false);
                }
            );
            setListening(started);
        }
    };

    const handleAddQA = async () => {
        if (!newQuestion.trim() || !newAnswer.trim()) {
            Alert.alert('Error', 'Please enter both question and answer');
            return;
        }

        try {
            await qaAPI.create({ question: newQuestion, answer: newAnswer });
            setNewQuestion('');
            setNewAnswer('');
            loadData();
            Alert.alert('Success', 'Q&A pair added successfully');
        } catch (error) {
            console.error('Error adding Q&A:', error);
            Alert.alert('Error', 'Failed to add Q&A pair');
        }
    };

    const handleDeleteQA = (id) => {
        Alert.alert(
            'Delete Q&A',
            'Are you sure you want to delete this Q&A pair?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await qaAPI.delete(id);
                            loadData();
                        } catch (error) {
                            console.error('Error deleting Q&A:', error);
                            Alert.alert('Error', 'Failed to delete Q&A pair');
                        }
                    },
                },
            ]
        );
    };

    const renderUser = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userRole}>Role: {item.role}</Text>
            </View>
            <TouchableOpacity
                style={[styles.toggleButton, item.is_active ? styles.activeButton : styles.inactiveButton]}
                onPress={() => handleToggleUser(item.id, item.is_active)}>
                <Text style={styles.toggleButtonText}>
                    {item.is_active ? 'Deactivate' : 'Activate'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderQA = ({ item }) => (
        <View style={styles.qaCard}>
            <Text style={styles.qaQuestion}>Q: {item.question}</Text>
            <Text style={styles.qaAnswer}>A: {item.answer}</Text>
            <View style={styles.qaFooter}>
                <Text style={styles.qaLanguage}>Language: {item.language}</Text>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteQA(item.id)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Hover Zone - Touch this area to show header */}
            <TouchableWithoutFeedback onPress={handleHeaderHover}>
                <View style={styles.hoverZone}>
                    <View style={styles.hoverIndicator} />
                </View>
            </TouchableWithoutFeedback>

            {/* Animated Header */}
            <Animated.View style={[styles.header, { opacity: headerOpacity, height: headerHeight }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Admin Panel</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'users' && styles.activeTab]}
                    onPress={() => setActiveTab('users')}>
                    <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
                        Users
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'qa' && styles.activeTab]}
                    onPress={() => setActiveTab('qa')}>
                    <Text style={[styles.tabText, activeTab === 'qa' && styles.activeTabText]}>
                        Q&A Pairs
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10a37f" />
                </View>
            ) : (
                <>
                    {activeTab === 'users' ? (
                        <>
                            {stats && (
                                <View style={styles.statsContainer}>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>{stats.totalUsers}</Text>
                                        <Text style={styles.statLabel}>Total Users</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>{stats.activeUsers}</Text>
                                        <Text style={styles.statLabel}>Active</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>{stats.totalQAPairs}</Text>
                                        <Text style={styles.statLabel}>Q&A Pairs</Text>
                                    </View>
                                </View>
                            )}
                            <FlatList
                                data={users}
                                renderItem={renderUser}
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={styles.list}
                            />
                        </>
                    ) : (
                        <ScrollView style={styles.qaContainer}>
                            {/* Add Q&A Form */}
                            <View style={styles.addQAForm}>
                                <Text style={styles.formTitle}>Add New Q&A Pair</Text>

                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={styles.textArea}
                                        placeholder="Enter your question here... (you can also use the microphone 🎤)"
                                        placeholderTextColor="#666"
                                        value={newQuestion}
                                        onChangeText={setNewQuestion}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                    <TouchableOpacity
                                        style={[styles.voiceButton, isListeningQuestion && styles.voiceButtonActive]}
                                        onPress={() => handleVoiceInput('question')}>
                                        <Text style={styles.voiceButtonText}>
                                            {isListeningQuestion ? '⏹️' : '🎤'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={styles.textArea}
                                        placeholder="Enter the answer here... (you can also use the microphone 🎤)"
                                        placeholderTextColor="#666"
                                        value={newAnswer}
                                        onChangeText={setNewAnswer}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                    <TouchableOpacity
                                        style={[styles.voiceButton, isListeningAnswer && styles.voiceButtonActive]}
                                        onPress={() => handleVoiceInput('answer')}>
                                        <Text style={styles.voiceButtonText}>
                                            {isListeningAnswer ? '⏹️' : '🎤'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={handleAddQA}>
                                    <Text style={styles.addButtonText}>Add Q&A Pair</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Q&A List */}
                            <FlatList
                                data={qaPairs}
                                renderItem={renderQA}
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={styles.list}
                                scrollEnabled={false}
                            />
                        </ScrollView>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f0f',
    },
    hoverZone: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        zIndex: 100,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 5,
    },
    hoverIndicator: {
        width: 60,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
    },
    header: {
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        overflow: 'hidden',
        zIndex: 99,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        backgroundColor: '#10a37f',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        marginTop: 50,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#10a37f',
    },
    tabText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#10a37f',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        color: '#10a37f',
        fontSize: 32,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#999',
        fontSize: 14,
        marginTop: 4,
    },
    list: {
        padding: 16,
    },
    userCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        color: '#999',
        fontSize: 14,
        marginBottom: 4,
    },
    userRole: {
        color: '#666',
        fontSize: 12,
    },
    toggleButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    activeButton: {
        backgroundColor: '#ef4444',
    },
    inactiveButton: {
        backgroundColor: '#10a37f',
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    qaContainer: {
        flex: 1,
    },
    addQAForm: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        margin: 16,
        borderRadius: 12,
    },
    formTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    inputGroup: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    input: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#fff',
        marginRight: 8,
        minHeight: 60,
    },
    textArea: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        marginRight: 8,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    voiceButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButtonActive: {
        backgroundColor: '#ef4444',
    },
    voiceButtonText: {
        fontSize: 20,
    },
    addButton: {
        backgroundColor: '#10a37f',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    qaCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    qaQuestion: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    qaAnswer: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 12,
    },
    qaFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qaLanguage: {
        color: '#666',
        fontSize: 12,
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
