import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatAPI } from '../services/api';
import voiceService from '../services/voiceService';
import ttsService from '../services/ttsService';

export default function ChatScreen({ navigation, route }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [user, setUser] = useState(null);
    const [headerVisible, setHeaderVisible] = useState(false);
    const flatListRef = useRef(null);
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerHeight = useRef(new Animated.Value(0)).current;
    const hideTimer = useRef(null);

    useEffect(() => {
        loadUser();
        return () => {
            voiceService.destroy();
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
            }
        };
    }, []);

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

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const handleSendMessage = async (text = inputText) => {
        if (!text.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsSending(true);

        try {
            const response = await chatAPI.sendMessage(text);
            const { answer, source } = response.data;

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: answer,
                source,
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Auto-speak the AI response
            await ttsService.speak(answer);
        } catch (error) {
            console.error('Send message error:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleVoiceInput = async () => {
        if (isListening) {
            await voiceService.stopListening();
            setIsListening(false);
        } else {
            const started = await voiceService.startListening(
                'en-US',
                (text) => {
                    setInputText(text);
                    setIsListening(false);
                },
                (error) => {
                    Alert.alert('Voice Error', error);
                    setIsListening(false);
                }
            );
            setIsListening(started);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('authToken');
                        await AsyncStorage.removeItem('user');
                        navigation.replace('Login');
                    },
                },
            ]
        );
    };

    const handleHeaderHover = () => {
        setHeaderVisible(true);
    };

    const renderMessage = ({ item }) => (
        <View
            style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}>
            <Text style={styles.messageText}>{item.content}</Text>
            {item.source && (
                <Text style={styles.sourceText}>
                    {item.source === 'database' ? '📚 From your Q&A' : '🤖 AI Generated'}
                </Text>
            )}
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
                    <Text style={styles.headerTitle}>FakeAI</Text>
                    <View style={styles.headerButtons}>
                        {user?.role === 'admin' && (
                            <TouchableOpacity
                                style={styles.adminButton}
                                onPress={() => navigation.navigate('Admin')}>
                                <Text style={styles.adminButtonText}>Admin</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Start a conversation</Text>
                        <Text style={styles.emptySubtext}>
                            Ask me anything or tap the microphone to speak
                        </Text>
                        <Text style={styles.hintText}>
                            💡 Touch the top of the screen for menu
                        </Text>
                    </View>
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        placeholderTextColor="#666"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        editable={!isSending}
                    />

                    <TouchableOpacity
                        style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                        onPress={handleVoiceInput}
                        disabled={isSending}>
                        <Text style={styles.voiceButtonText}>
                            {isListening ? '⏹️' : '🎤'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
                        onPress={() => handleSendMessage()}
                        disabled={!inputText.trim() || isSending}>
                        {isSending ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.sendButtonText}>➤</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    adminButton: {
        backgroundColor: '#10a37f',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    adminButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    messagesList: {
        padding: 16,
        paddingTop: 60,
        flexGrow: 1,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#10a37f',
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#2a2a2a',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 22,
    },
    sourceText: {
        color: '#ccc',
        fontSize: 12,
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    hintText: {
        color: '#444',
        fontSize: 14,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#fff',
        maxHeight: 100,
        marginRight: 8,
    },
    voiceButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    voiceButtonActive: {
        backgroundColor: '#ef4444',
    },
    voiceButtonText: {
        fontSize: 20,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10a37f',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
