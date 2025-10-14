import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
    FaStethoscope, FaHeartbeat, FaBrain, FaBaby, FaBone, FaClinicMedical,
    FaUserMd, FaXRay, FaBookMedical, FaFirstAid, FaProcedures, FaMicroscope,
    FaEye, FaAllergies, FaSyringe, FaSearch, FaBookOpen, FaComments, FaStar,
    FaChevronDown, FaChevronUp, FaPaperPlane, FaImage, FaTimes, FaUser, FaEnvelope,
    FaLock, FaMapMarkerAlt, FaSignInAlt, FaSignOutAlt, FaUserCircle, FaCog,
    FaPalette, FaFont, FaSave, FaUndo, FaSearchPlus, FaSearchMinus
} from 'react-icons/fa';
import { FaCut, FaUserAlt, FaRegUser, FaHeadSideCough } from 'react-icons/fa';
import { GiKidneys, GiLungs, GiSpiderWeb, GiStomach } from 'react-icons/gi';
import { MdPsychology, MdEmergency, MdForum } from 'react-icons/md';
import './specialty.css';
import './index.css';

// SINGLETON: Initialize Supabase client once
let supabaseInstance = null;

const getSupabaseClient = () => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey ||
            supabaseUrl.includes('your-project-ref') ||
            supabaseKey.includes('your-anon-key-here')) {
            console.warn('Supabase not configured. Please set up your .env file');
            supabaseInstance = createMockClient();
            return supabaseInstance;
        }

        supabaseInstance = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized (singleton)');
        return supabaseInstance;
    } catch (error) {
        console.error('Error creating Supabase client:', error);
        supabaseInstance = createMockClient();
        return supabaseInstance;
    }
};

// Mock client for development
const createMockClient = () => {
    console.log('Using mock Supabase client for development');
    return {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signUp: (credentials) => {
                console.log('Mock signUp called with:', credentials);
                return Promise.resolve({
                    data: {
                        user: {
                            id: uuidv4(),
                            email: credentials.email,
                            user_metadata: { username: credentials.options?.data?.username }
                        },
                        session: null
                    },
                    error: null
                });
            },
            signInWithPassword: (credentials) => {
                console.log('Mock signIn called with:', credentials);
                return Promise.resolve({
                    data: {
                        user: {
                            id: uuidv4(),
                            email: credentials.email,
                            user_metadata: { username: 'mockuser' }
                        },
                        session: null
                    },
                    error: null
                });
            },
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: (callback) => {
                const subscription = {
                    unsubscribe: () => {}
                };
                return { data: { subscription } };
            }
        },
        from: (table) => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: (data) => {
                console.log('Mock insert called for table:', table, 'with data:', data);
                return Promise.resolve({ data: null, error: null });
            },
            update: () => Promise.resolve({ data: null, error: null }),
            on: () => ({
                subscribe: () => ({
                    unsubscribe: () => {}
                })
            })
        }),
        channel: () => ({
            on: () => ({
                subscribe: () => ({
                    unsubscribe: () => {}
                })
            })
        }),
        storage: {
            from: (bucket) => ({
                upload: (path, file) => {
                    console.log('Mock upload called for bucket:', bucket, 'path:', path);
                    return Promise.resolve({
                        data: { path },
                        error: null
                    });
                },
                getPublicUrl: (path) => ({
                    data: {
                        publicUrl: `https://example.com/${bucket}/${path}`
                    }
                }),
                list: () => Promise.resolve({ data: [], error: null }),
                remove: () => Promise.resolve({ data: null, error: null })
            })
        }
    };
};

const supabase = getSupabaseClient();

// Default user preferences
const defaultPreferences = {
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    fontSize: '16px',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '8px'
};

// Cache busting utility
const getCacheBustedUrl = (url) => {
    if (!url) return null;
    const sessionTimestamp = sessionStorage.getItem('avatar_cache_buster') || Date.now();
    return `${url}?t=${sessionTimestamp}`;
};

// Function to get exact street address from coordinates using OpenStreetMap Nominatim
const getLocationTextFromCoords = async (latitude, longitude) => {
    try {
        // OpenStreetMap Nominatim API - more reliable for reverse geocoding
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
        const data = await response.json();

        console.log('OpenStreetMap Nominatim Response:', data);

        if (data && data.address) {
            const address = data.address;

            // Build address from most specific to least specific
            let addressParts = [];

            // Street level
            if (address.road) {
                if (address.house_number) {
                    addressParts.push(`${address.house_number} ${address.road}`);
                } else {
                    addressParts.push(address.road);
                }
            }

            // City/town level
            if (address.city) {
                addressParts.push(address.city);
            } else if (address.town) {
                addressParts.push(address.town);
            } else if (address.village) {
                addressParts.push(address.village);
            } else if (address.municipality) {
                addressParts.push(address.municipality);
            }

            // State level
            if (address.state) {
                addressParts.push(address.state);
            }

            // Country level (as fallback)
            if (address.country && addressParts.length === 0) {
                addressParts.push(address.country);
            }

            if (addressParts.length > 0) {
                const fullAddress = addressParts.join(', ');
                console.log('Full address from OpenStreetMap:', fullAddress);
                return fullAddress;
            }
        }

        // Fallback: Use coordinates if no address found
        console.log('No address found, using coordinates');
        return `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
        console.error('Error getting location text from OpenStreetMap:', error);

        // Final fallback: Try a simpler approach with just city/state
        try {
            const simpleResponse = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const simpleData = await simpleResponse.json();

            if (simpleData && simpleData.city && simpleData.countryName) {
                return `${simpleData.city}, ${simpleData.countryName}`;
            } else if (simpleData && simpleData.locality) {
                return simpleData.locality;
            }
        } catch (fallbackError) {
            console.error('Fallback geocoding also failed:', fallbackError);
        }

        return `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
};

function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBottom, setIsBottom] = useState(false);
    const [activeSpecialty, setActiveSpecialty] = useState(null);
    const [userRatings, setUserRatings] = useState({});
    const [hoveredAvatar, setHoveredAvatar] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const currentUserRef = useRef(currentUser);

    // Image enlargement states
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Avatar loading state
    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const [avatarKey, setAvatarKey] = useState(Date.now());

    const [isUploading, setIsUploading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [authForm, setAuthForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [authError, setAuthError] = useState('');
    const [supabaseConfigured, setSupabaseConfigured] = useState(true);
    const [authSuccess, setAuthSuccess] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [userPreferences, setUserPreferences] = useState(defaultPreferences);
    const [tempPreferences, setTempPreferences] = useState(defaultPreferences);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // FIX: Track initialization to prevent multiple setups
    const authInitializedRef = useRef(false);
    const authSubscriptionRef = useRef(null);

    // Image enlargement functions
    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
        setImageZoom(1);
        setImagePosition({ x: 0, y: 0 });
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
        setImageZoom(1);
        setImagePosition({ x: 0, y: 0 });
    };

    const handleImageWheel = (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        setImageZoom(prev => Math.max(0.5, Math.min(3, prev * zoomFactor)));
    };

    const handleImageMouseDown = (e) => {
        if (imageZoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - imagePosition.x,
                y: e.clientY - imagePosition.y
            });
        }
    };

    const handleImageMouseMove = (e) => {
        if (isDragging) {
            setImagePosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleImageMouseUp = () => {
        setIsDragging(false);
    };

    // Initialize cache buster
    useEffect(() => {
        if (!sessionStorage.getItem('avatar_cache_buster')) {
            sessionStorage.setItem('avatar_cache_buster', Date.now().toString());
        }
    }, []);

    // Apply user preferences
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', userPreferences.primaryColor);
        root.style.setProperty('--secondary-color', userPreferences.secondaryColor);
        root.style.setProperty('--background-color', userPreferences.backgroundColor);
        root.style.setProperty('--text-color', userPreferences.textColor);
        root.style.setProperty('--font-size', userPreferences.fontSize);
        root.style.setProperty('--font-family', userPreferences.fontFamily);
        root.style.setProperty('--border-radius', userPreferences.borderRadius);
    }, [userPreferences]);

    // Sync auth form with user data
    useEffect(() => {
        if (currentUser && !currentUser.anonymous) {
            console.log('🔄 Setting auth form with user data:', {
                username: currentUser.username,
                email: currentUser.email,
                avatar_url: currentUser.avatar_url
            });

            const displayUsername = currentUser.username ||
                currentUser.user_metadata?.username ||
                currentUser.email?.split('@')[0] ||
                '';

            setAuthForm(prev => ({
                ...prev,
                username: displayUsername,
                email: currentUser.email || ''
            }));

            setAvatarLoadError(false);
            console.log('✅ Auth form set with username:', displayUsername);
        }
    }, [currentUser]);

    // Handle avatar URL changes
    useEffect(() => {
        if (currentUser?.avatar_url) {
            console.log('🎯 Avatar URL changed, forcing refresh:', currentUser.avatar_url);
            setAvatarKey(Date.now());
            setAvatarLoadError(false);
            const cacheBustedUrl = getCacheBustedUrl(currentUser.avatar_url);
            setAvatarPreview(cacheBustedUrl);
        } else {
            setAvatarPreview(null);
        }
    }, [currentUser?.avatar_url]);

    // Handle closing dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load user preferences
    useEffect(() => {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            try {
                const parsedPreferences = JSON.parse(savedPreferences);
                setUserPreferences(parsedPreferences);
                setTempPreferences(parsedPreferences);
            } catch (error) {
                console.error('Error parsing saved preferences:', error);
            }
        }
    }, []);

    // Check Supabase configuration
    useEffect(() => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey ||
            supabaseUrl.includes('your-project-ref') ||
            supabaseKey.includes('your-anon-key-here')) {
            setSupabaseConfigured(false);
            console.warn('Supabase not configured. Some features will be limited.');
        }
    }, []);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => {
            const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50;
            setIsBottom(bottom);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    if(entry.target.classList.contains('stagger')) {
                        entry.target.style.animationDelay = `${entry.target.dataset.delay * 0.2}s`;
                    }
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // FIXED: Single authentication initialization
    useEffect(() => {
        // Prevent multiple initializations
        if (authInitializedRef.current) {
            console.log('🚫 Auth already initialized, skipping...');
            return;
        }

        authInitializedRef.current = true;
        let mounted = true;

        console.log('🔐 INITIALIZING AUTHENTICATION (SINGLE TIME)...');

        const initializeAuth = async () => {
            if (!mounted) return;

            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    if (mounted) createAnonymousUser();
                    return;
                }

                if (session?.user) {
                    console.log('👤 User session found:', session.user.id);
                    // Set basic user first
                    const basicUser = {
                        ...session.user,
                        username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user'
                    };

                    if (mounted) {
                        setCurrentUser(basicUser);
                    }

                    // Then fetch complete profile
                    await fetchUserProfile(session.user.id);
                } else {
                    console.log('No session found, creating anonymous user');
                    if (mounted) createAnonymousUser();
                }
            } catch (error) {
                console.error('Error in auth initialization:', error);
                if (mounted) createAnonymousUser();
            }
        };

        initializeAuth();

        // Set up auth state change listener - ONLY ONCE
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                console.log('🔄 Auth state changed:', event);

                try {
                    if (event === 'SIGNED_IN' && session) {
                        console.log('✅ User signed in:', session.user.id);

                        // Set basic user first
                        const basicUser = {
                            ...session.user,
                            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user'
                        };
                        setCurrentUser(basicUser);

                        // Then fetch complete profile
                        await fetchUserProfile(session.user.id);
                    } else if (event === 'SIGNED_OUT') {
                        console.log('🚪 User signed out');
                        setCurrentUser(null);
                        createAnonymousUser();
                    } else if (event === 'USER_UPDATED' && session) {
                        console.log('📝 User updated, refreshing profile...');
                        await fetchUserProfile(session.user.id);
                    }
                } catch (error) {
                    console.error('❌ Error in auth state change:', error);
                }
            }
        );

        authSubscriptionRef.current = subscription;

        return () => {
            console.log('🧹 Cleaning up auth subscription');
            mounted = false;
            if (authSubscriptionRef.current) {
                authSubscriptionRef.current.unsubscribe();
            }
        };
    }, []); // Empty dependency array - run only once

    // Messages subscription
    useEffect(() => {
        if (currentUser && !currentUser.anonymous) {
            fetchMessages();

            try {
                const subscription = supabase
                    .channel('messages')
                    .on('postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'messages' },
                        (payload) => {
                            setMessages(prev => [...prev, payload.new]);
                        }
                    )
                    .subscribe();

                return () => {
                    subscription.unsubscribe();
                };
            } catch (error) {
                console.error('Error setting up real-time subscription:', error);
            }
        }
    }, [currentUser]);

    const createAnonymousUser = async () => {
        let userId = localStorage.getItem('mediconnect_anonymous_id');
        if (!userId) {
            userId = uuidv4();
            localStorage.setItem('mediconnect_anonymous_id', userId);
        }
        setCurrentUser({ id: userId, anonymous: true });
    };

    // FIXED: User profile fetching
    const fetchUserProfile = async (userId) => {
        try {
            console.log('🔄 Fetching user profile for:', userId);

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ Error fetching user profile:', error);
                if (error.code === 'PGRST116') {
                    console.log('User profile not found, creating new profile...');
                    await createUserProfile(userId);
                    return await fetchUserProfile(userId);
                }
                return null;
            } else if (data) {
                console.log('✅ User profile fetched:', data);

                // Get current auth session
                const { data: { session } } = await supabase.auth.getSession();
                const authUser = session?.user;

                // Create complete user object
                const completeUser = {
                    ...authUser,
                    ...data,
                    id: userId,
                    username: data.username ||
                        authUser?.user_metadata?.username ||
                        authUser?.email?.split('@')[0] ||
                        'user',
                    email: data.email || authUser?.email,
                    avatar_url: data.avatar_url, // CRITICAL: Use database avatar_url
                    user_metadata: authUser?.user_metadata
                };

                console.log('👤 Complete user object created:', {
                    id: completeUser.id,
                    username: completeUser.username,
                    email: completeUser.email,
                    avatar_url: completeUser.avatar_url
                });

                // Update current user state
                setCurrentUser(completeUser);

                // Update auth form
                setAuthForm(prev => ({
                    ...prev,
                    username: completeUser.username || '',
                    email: completeUser.email || ''
                }));

                console.log('✅ Profile fully loaded - Username:', completeUser.username, 'Avatar:', completeUser.avatar_url);
                return completeUser;
            }
        } catch (error) {
            console.error('❌ Error in fetchUserProfile:', error);
            return null;
        }
    };

    const createUserProfile = async (userId) => {
        try {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                console.error('Error getting user:', authError);
                return;
            }

            const username = authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || 'user';

            const { error } = await supabase
                .from('users')
                .insert([
                    {
                        id: userId,
                        username: username,
                        email: authUser?.email,
                        avatar_url: null,
                        preferences: defaultPreferences,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('Error creating user profile:', error);
            } else {
                console.log('✅ User profile created with username:', username);
                await fetchUserProfile(userId);
            }
        } catch (error) {
            console.error('Error in createUserProfile:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          *,
          user:users(username, avatar_url)
        `)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data || []);
            }
        } catch (error) {
            console.error('Error in fetchMessages:', error);
        }
    };

    // Force refresh user data
    const refreshUserData = async () => {
        if (currentUser && !currentUser.anonymous) {
            console.log('🔄 Manually refreshing user data...');
            await fetchUserProfile(currentUser.id);
        }
    };

    // Updated emergency click handler to include coordinates in both popup and messages
    const handleEmergencyClick = async () => {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            // Get exact street address from coordinates
            const locationText = await getLocationTextFromCoords(location.latitude, location.longitude);

            // Create message text that includes both address and coordinates
            const coordinatesText = `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
            const fullLocationText = `${locationText} (${coordinatesText})`;

            const { error } = await supabase
                .from('messages')
                .insert([
                    {
                        user_id: currentUser.id,
                        text: `🚨 EMERGENCY ALERT - Need immediate medical assistance! Location: ${fullLocationText}`,
                        location: {
                            ...location,
                            text: locationText // Add location text to location object
                        },
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('Error sending emergency alert:', error);
                alert(`🚨 Emergency alert sent locally! Exact location: ${fullLocationText}`);
            } else {
                alert(`🚨 Emergency alert sent! Exact location: ${fullLocationText}`);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Emergency alert sent without location!');
        }
    };

    const handleRating = (author, rating) => {
        setUserRatings(prev => ({
            ...prev,
            [author]: rating
        }));
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setAvatarLoadError(false);
        }
    };

    const removeAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarLoadError(false);
    };

    const forceRefreshAvatar = () => {
        console.log('🔄 Force refreshing avatar...');
        setAvatarKey(Date.now());
        setAvatarLoadError(false);
        sessionStorage.setItem('avatar_cache_buster', Date.now().toString());
        if (currentUser?.avatar_url) {
            const newUrl = getCacheBustedUrl(currentUser.avatar_url);
            setAvatarPreview(newUrl);
        }
    };

    // Authentication handler
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');

        if (!supabaseConfigured) {
            setAuthError('Supabase not configured. Please set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
            return;
        }

        if (authMode === 'register') {
            if (authForm.password !== authForm.confirmPassword) {
                setAuthError('Passwords do not match');
                return;
            }

            if (authForm.password.length < 6) {
                setAuthError('Password must be at least 6 characters long');
                return;
            }

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: authForm.email,
                    password: authForm.password,
                    options: {
                        data: {
                            username: authForm.username
                        }
                    }
                });

                if (error) {
                    setAuthError(error.message);
                } else if (data.user) {
                    console.log('✅ USER CREATED:', data.user);

                    try {
                        const { error: profileError } = await supabase
                            .from('users')
                            .insert([
                                {
                                    id: data.user.id,
                                    username: authForm.username,
                                    email: authForm.email,
                                    avatar_url: null,
                                    preferences: defaultPreferences,
                                    created_at: new Date().toISOString()
                                }
                            ]);

                        if (profileError) {
                            console.error('❌ Profile creation failed:', profileError);
                            setAuthSuccess('Account created! Please sign in to complete profile setup.');
                        } else {
                            console.log('✅ User profile created with username:', authForm.username);
                            setAuthSuccess('Account created successfully! Please check your email for verification.');
                        }
                    } catch (profileError) {
                        console.error('❌ Profile creation error:', profileError);
                        setAuthSuccess('Account created! Some features may be limited until you sign in.');
                    }

                    setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
                    setAvatarFile(null);
                    setAvatarPreview(null);

                    setTimeout(() => {
                        setShowAuthModal(false);
                    }, 3000);
                }
            } catch (error) {
                console.error('Authentication error:', error);
                setAuthError('Authentication service unavailable. Please try again later.');
            }
        } else {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authForm.email,
                    password: authForm.password
                });

                if (error) {
                    setAuthError(error.message);
                } else {
                    setShowAuthModal(false);
                    setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
                    setAuthSuccess('Login successful!');
                    setTimeout(() => {
                        setAuthSuccess('');
                    }, 3000);
                }
            } catch (error) {
                console.error('Login error:', error);
                setAuthError('Login service unavailable. Please try again later.');
            }
        }
    };

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error.message);
                setAuthError('Error signing out: ' + error.message);
            } else {
                setCurrentUser(null);
                setIsUserMenuOpen(false);
                setAuthSuccess('You have been signed out successfully.');
                createAnonymousUser();
                setTimeout(() => {
                    setAuthSuccess('');
                }, 3000);
            }
        } catch (error) {
            console.error('Sign out error:', error);
            setAuthError('Error signing out. Please try again.');
        }
    };

    // Updated send message handler to include coordinates in messages
    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedImage) return;

        if (!supabaseConfigured) {
            setAuthError('Chat feature unavailable. Please configure Supabase first.');
            return;
        }

        setIsUploading(true);
        let imageUrl = null;

        if (selectedImage) {
            try {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('message-images')
                    .upload(fileName, selectedImage);

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    setIsUploading(false);
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('message-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            } catch (error) {
                console.error('Error in image upload:', error);
                setIsUploading(false);
                return;
            }
        }

        let location = null;
        let locationText = 'Location not available';

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 60000
                });
            });

            location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            // Get exact street address for regular messages too
            locationText = await getLocationTextFromCoords(location.latitude, location.longitude);

            // Add coordinates to the location text for regular messages
            const coordinatesText = `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
            const fullLocationText = `${locationText} (${coordinatesText})`;

            location.text = fullLocationText; // Add full location text to location object

        } catch (error) {
            console.log('Location access not available or denied');
        }

        try {
            const { error } = await supabase
                .from('messages')
                .insert([
                    {
                        text: newMessage,
                        image_url: imageUrl,
                        location: location,
                        user_id: currentUser.id,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('Error sending message:', error);
            } else {
                setNewMessage('');
                setSelectedImage(null);
            }
        } catch (error) {
            console.error('Error in send message:', error);
        }

        setIsUploading(false);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    const handleSavePreferences = async () => {
        localStorage.setItem('userPreferences', JSON.stringify(tempPreferences));
        setUserPreferences(tempPreferences);

        if (currentUser && !currentUser.anonymous) {
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ preferences: tempPreferences })
                    .eq('id', currentUser.id);

                if (error) {
                    console.error('Error saving preferences:', error);
                } else {
                    setAuthSuccess('Preferences saved successfully!');
                    setTimeout(() => setAuthSuccess(''), 3000);
                }
            } catch (error) {
                console.error('Error saving preferences:', error);
            }
        }

        setShowSettings(false);
    };

    const handleResetPreferences = () => {
        setTempPreferences(defaultPreferences);
    };

    // Avatar upload function
    const handleUpdateProfile = async () => {
        if (!currentUser || currentUser.anonymous) {
            setAuthError('You must be logged in to update your profile');
            return;
        }

        console.log('🚀 Starting profile update for user:', currentUser.id);

        try {
            setAuthError('');
            setIsUploading(true);

            const updateData = {};
            let hasChanges = false;

            if (authForm.username && authForm.username.trim() && authForm.username !== currentUser.username) {
                updateData.username = authForm.username.trim();
                hasChanges = true;
                console.log('📝 Username will be updated');
            }

            if (avatarFile) {
                console.log('📤 Starting avatar upload...');

                try {
                    const fileExt = avatarFile.name.split('.').pop();
                    const fileName = `avatar-${currentUser.id}-${Date.now()}.${fileExt}`;

                    console.log('📁 Uploading:', fileName, 'Size:', avatarFile.size);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, avatarFile);

                    if (uploadError) {
                        console.error('❌ UPLOAD FAILED:', uploadError);
                        if (uploadError.message?.includes('bucket')) {
                            setAuthError('Storage bucket "avatars" not found. Create it in Supabase Dashboard -> Storage.');
                        } else if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
                            setAuthError('Storage permissions issue. Check bucket policies.');
                        } else if (uploadError.message?.includes('JWT')) {
                            setAuthError('Authentication error. Try signing out and in again.');
                        } else {
                            setAuthError(`Upload failed: ${uploadError.message}`);
                        }
                        setIsUploading(false);
                        return;
                    }

                    console.log('✅ Upload successful:', uploadData);

                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    const avatarUrl = urlData.publicUrl;
                    console.log('🔗 Public URL:', avatarUrl);

                    updateData.avatar_url = avatarUrl;
                    hasChanges = true;

                } catch (uploadError) {
                    console.error('💥 Upload exception:', uploadError);
                    setAuthError(uploadError.message || 'Upload failed unexpectedly');
                    setIsUploading(false);
                    return;
                }
            }

            if (hasChanges) {
                console.log('💾 Updating user profile...');

                const { data, error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', currentUser.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Profile update failed:', updateError);
                    setAuthError(`Profile update failed: ${updateError.message}`);
                    setIsUploading(false);
                    return;
                }

                console.log('✅ Profile updated:', data);

                // Update local state and force refresh
                setCurrentUser(prev => ({
                    ...prev,
                    ...data,
                    username: data.username || prev.username,
                    avatar_url: data.avatar_url
                }));

                // Force refresh user data
                setTimeout(() => {
                    fetchUserProfile(currentUser.id);
                }, 100);

                setAvatarKey(Date.now());
                setAvatarLoadError(false);
                setAvatarFile(null);
                setAvatarPreview(null);

                setAuthSuccess('Profile updated successfully!');

                setTimeout(() => {
                    setIsUserMenuOpen(false);
                    setAuthSuccess('');
                }, 2000);

            } else {
                setAuthSuccess('No changes to save');
                setTimeout(() => setAuthSuccess(''), 1500);
            }

        } catch (error) {
            console.error('💥 Unexpected error:', error);
            setAuthError('An unexpected error occurred: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const debugStorage = async () => {
        if (!currentUser) {
            alert('Please log in first');
            return;
        }

        console.log('🔍 DEBUGGING STORAGE...');

        try {
            console.log('1. Testing bucket access...');
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            console.log('Buckets:', buckets);
            console.log('Buckets error:', bucketsError);

            console.log('2. Testing avatars bucket...');
            const { data: files, error: filesError } = await supabase.storage.from('avatars').list();
            console.log('Files in avatars:', files);
            console.log('Files error:', filesError);

            console.log('3. Testing simple upload...');
            const testBlob = new Blob(['test content'], { type: 'text/plain' });
            const testFile = new File([testBlob], `test-${currentUser.id}.txt`);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(testFile.name, testFile);

            console.log('Test upload result:', uploadData);
            console.log('Test upload error:', uploadError);

            if (!uploadError) {
                await supabase.storage.from('avatars').remove([testFile.name]);
                console.log('✅ Storage test PASSED');
                alert('Storage is working correctly!');
            } else {
                console.log('❌ Storage test FAILED:', uploadError);
                alert('Storage test failed: ' + uploadError.message);
            }

        } catch (error) {
            console.error('💥 Debug error:', error);
            alert('Debug failed: ' + error.message);
        }
    };

    const getDisplayUsername = () => {
        if (!currentUser) return 'User';
        return currentUser.username ||
            currentUser.user_metadata?.username ||
            currentUser.email?.split('@')[0] ||
            'User';
    };

    const getAvatarUrl = () => {
        if (!currentUser?.avatar_url) return null;
        return getCacheBustedUrl(currentUser.avatar_url);
    };

    const handleAvatarError = () => {
        console.log('❌ Avatar image failed to load:', currentUser?.avatar_url);
        setAvatarLoadError(true);
    };

    const handleAvatarLoad = () => {
        console.log('✅ Avatar image loaded successfully');
        setAvatarLoadError(false);
    };

    const setupStoragePolicies = async () => {
        if (!currentUser) {
            setAuthError('Please log in first to set up storage');
            return;
        }

        setIsUploading(true);
        setAuthError('');

        try {
            const testBlob = new Blob(['test'], { type: 'text/plain' });
            const testFile = new File([testBlob], `test-${currentUser.id}.txt`);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(testFile.name, testFile);

            if (uploadError && uploadError.message.includes('bucket')) {
                setAuthError('The "avatars" bucket does not exist. Please create it in Supabase Dashboard -> Storage.');
            } else if (uploadError && uploadError.message.includes('policy')) {
                setAuthError('Storage policies are not set. Please run the storage setup SQL in Supabase SQL Editor.');
            } else {
                setAuthSuccess('Storage appears to be working! You can now upload avatars.');
                await supabase.storage.from('avatars').remove([testFile.name]);
            }
        } catch (error) {
            console.error('Storage test error:', error);
            setAuthError('Storage test failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const SpecialtyCard = ({ specialty }) => {
        return (
            <div className={`specialty-card specialty-${specialty.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="specialty-content">
                    <div className={`specialty-icon icon-${specialty.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        {specialty.icon}
                    </div>
                    <h3>{specialty.name}</h3>
                    <p className="specialty-description">{specialty.description}</p>
                    <div className="specialty-cases">
                        {specialty.cases.map((caseStudy, index) => (
                            <span key={index} className="case-tag">{caseStudy}</span>
                        ))}
                    </div>
                </div>
                <div className="specialty-btn-container">
                    <button className="specialty-btn">
                        Book Consultation
                    </button>
                </div>
            </div>
        );
    };

    // Your JSX remains exactly the same...
    return (
        <div className="app">
            {/* Debug Component */}
            <div style={{
                position: 'fixed',
                bottom: '800px',
                right: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '10px',
                fontSize: '12px',
                zIndex: 10000,
                borderRadius: '8px'
            }}>
                <div>User: {currentUser ? getDisplayUsername() : 'None'}</div>
                <div>Avatar: {currentUser?.avatar_url ? 'Yes' : 'No'}</div>
                <div>Anonymous: {currentUser?.anonymous ? 'Yes' : 'No'}</div>
                <button onClick={refreshUserData} style={{ fontSize: '10px', marginTop: '5px' }}>
                    Refresh
                </button>
            </div>

            {/* Configuration Warning Banner */}
            {!supabaseConfigured && (
                <div className="config-warning-banner">
                    <div className="warning-content">
                        <span>⚠️ Supabase not configured. Some features will be limited. </span>
                        <a href="#setup-instructions" className="setup-link">Click here for setup instructions</a>
                    </div>
                    <button onClick={() => setSupabaseConfigured(true)} className="close-warning">
                        ×
                    </button>
                </div>
            )}

            {/* Setup Instructions Modal */}
            {!supabaseConfigured && (
                <div id="setup-instructions" className="setup-modal">
                    <div className="setup-content">
                        <h2>Supabase Setup Required</h2>
                        <p>To enable all features, please set up Supabase:</p>
                        <ol>
                            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> and create a project</li>
                            <li>Get your URL and API key from Settings → API</li>
                            <li>Create a <code>.env</code> file in your project root:</li>
                        </ol>
                        <pre>
{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
                        </pre>
                        <p>Replace the values with your actual Supabase credentials</p>
                        <button onClick={() => setSupabaseConfigured(true)}>Got it!</button>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {authSuccess && (
                <div className="auth-success-banner">
                    <div className="success-content">
                        <span>✅ {authSuccess}</span>
                    </div>
                    <button onClick={() => setAuthSuccess('')} className="close-success">
                        ×
                    </button>
                </div>
            )}

            <a href="/" className="logo-container hidden">
                <img src="/logo-w1.png" alt="MediConnect" className="logo-img animate-pulse" />
                <span className="logo-text gradient-text">MediConnect</span>
            </a>

            <nav className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
                <div className={`nav-content ${isMenuOpen ? 'visible' : ''}`}>
                    <input
                        type="text"
                        className="search-bar glassmorphism-input"
                        placeholder="Search services..."
                    />
                    <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                        {['Learning', 'Appointments', 'Emergencies'].map((link) => (
                            <a
                                key={link}
                                href={`/${link.toLowerCase()}`}
                                className="nav-link hover-text-lavender-dark"
                            >
                                {link}
                            </a>
                        ))}

                        {/* User Authentication in Menu with improved avatar handling */}
                        {currentUser && !currentUser.anonymous ? (
                            <div className="user-menu" ref={userMenuRef}>
                                <button className="user-info-button" onClick={() => setIsUserMenuOpen(prev => !prev)}>
                                    {currentUser.avatar_url && !avatarLoadError ? (
                                        <img
                                            key={avatarKey}
                                            src={getAvatarUrl()}
                                            alt={currentUser.username}
                                            className="user-avatar"
                                            onError={handleAvatarError}
                                            onLoad={handleAvatarLoad}
                                        />
                                    ) : (
                                        <FaUserCircle className="user-avatar-placeholder" />
                                    )}
                                    <span className="user-welcome">Hi, {getDisplayUsername()}</span>
                                    {isUserMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
                                </button>

                                {isUserMenuOpen && (
                                    <div className="user-dropdown-menu">
                                        <h3>Profile Settings</h3>

                                        {/* Add debug section */}
                                        <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                                            <button
                                                onClick={debugStorage}
                                                className="btn btn-sm btn-secondary"
                                                style={{ width: '100%', marginBottom: '5px' }}
                                            >
                                                Test Storage Setup
                                            </button>
                                            <small style={{ color: '#666' }}>
                                                If avatars aren't working, click this to diagnose storage issues.
                                            </small>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="username"><FaUser /> Username</label>
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={authForm.username}
                                                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                                                placeholder="Your username"
                                            />
                                            <small>Current: {currentUser.username || 'Not set'}</small>
                                        </div>

                                        <div className="form-group">
                                            <label><FaImage /> Avatar</label>
                                            <div className="avatar-upload-container">
                                                {avatarPreview ? (
                                                    <img
                                                        src={avatarPreview}
                                                        alt="Avatar preview"
                                                        className="avatar-preview"
                                                        onError={handleAvatarError}
                                                    />
                                                ) : currentUser.avatar_url && !avatarLoadError ? (
                                                    <img
                                                        key={`preview-${avatarKey}`}
                                                        src={getAvatarUrl()}
                                                        alt="Current avatar"
                                                        className="avatar-preview"
                                                        onError={handleAvatarError}
                                                        onLoad={handleAvatarLoad}
                                                    />
                                                ) : (
                                                    <div className="avatar-placeholder-large"><FaUserCircle /></div>
                                                )}
                                                <div className="avatar-actions">
                                                    <input
                                                        type="file"
                                                        id="avatar-upload"
                                                        onChange={handleAvatarSelect}
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="avatar-upload" className="btn btn-sm btn-sage">Change</label>
                                                    {(avatarPreview || currentUser.avatar_url) && (
                                                        <button onClick={removeAvatar} className="btn-remove-avatar"><FaTimes /></button>
                                                    )}
                                                </div>
                                            </div>
                                            {avatarFile && (
                                                <small>Selected: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)</small>
                                            )}
                                        </div>

                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdateProfile}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? 'Updating...' : <><FaSave /> Save Changes</>}
                                        </button>

                                        {authError && (
                                            <div className="auth-error">
                                                {authError}
                                            </div>
                                        )}

                                        <hr className="divider" />
                                        <button className="btn btn-danger" onClick={handleSignOut}>
                                            <FaSignOutAlt /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                className="btn btn-sage"
                                onClick={() => {
                                    setShowAuthModal(true);
                                    setAuthMode('login');
                                    setAuthError('');
                                    setAuthSuccess('');
                                }}
                            >
                                <FaSignInAlt /> Sign In
                            </button>
                        )}
                    </div>
                </div>

                <div
                    className="hamburger-container"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <div className="hamburger">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}
                            />
                        ))}
                    </div>
                    <div className={`hamburger-pulse ${isMenuOpen ? 'animate-ripple' : ''}`} />
                </div>
            </nav>

            <main>
                <div className="massive-logo-wrapper">
                    <img
                        src="/logo-w1.png"
                        alt="MediConnect"
                        className="massive-logo-img animate-float"
                    />
                </div>

                <section className="hero">
                    <div className="hero-content hidden">
                        <div className="hero-text">
                            <h1 className="text-gradient animate-text-reveal">
                                Medical Collaboration & Emergency Platform
                            </h1>
                            <div className="cta-buttons">
                                <button
                                    className="btn btn-lavender hover-scale-105"
                                    onClick={handleEmergencyClick}
                                >
                                    Emergency Alert
                                </button>
                                <button className="btn btn-sage hover-scale-105">
                                    Book Appointment
                                </button>
                            </div>
                        </div>

                        <div className="hero-image hidden">
                            <div className="gradient-blob animate-blob" />
                            <img
                                src="/collaborate.jpg"
                                alt="Healthcare professionals collaborating"
                                className="floating transition-transform-duration-300 hover-scale-105 hero-image-radius"
                            />
                        </div>

                        <p className="text-sage-800 description-text">
                            Connect with medical experts, access learning resources, and get immediate help when needed.
                        </p>

                        <div className="user-roles">
                            <div className="role-container doctor-container hidden" data-delay="0">
                                <span className="role-badge doctor-badge">Doctors</span>
                                <p className="role-description">Teach and consult</p>
                            </div>

                            <div className="role-container student-container hidden" data-delay="0.2">
                                <span className="role-badge student-badge">Students</span>
                                <p className="role-description">Learn and discuss</p>
                            </div>

                            <div className="role-container resident-container hidden" data-delay="0.4">
                                <span className="role-badge resident-badge">Residents</span>
                                <p className="role-description">Train and mentor</p>
                            </div>

                            <div className="role-container patient-container hidden" data-delay="0.6">
                                <span className="role-badge patient-badge">Patients</span>
                                <p className="role-description">Get care and support</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="features hidden">
                    <div className="feature-buttons">
                        <button className="feature-btn emergency-btn">
                            <div className="btn-content">
                                <span className="audience-tag">For Everyone</span>
                                <h3 className="btn-title">Code Blue Connect</h3>
                                <p className="btn-description">
                                    Instant geolocated SOS broadcasting to verified medical responders
                                    within a 5-mile radius
                                </p>
                                <span className="btn-action-b">
                                    <MdEmergency className="icon" />
                                    Trigger Alert
                                </span>
                            </div>
                        </button>

                        <button className="feature-btn specialist-btn">
                            <div className="btn-content">
                                <span className="audience-tag">For Patients</span>
                                <h3 className="btn-title">Precision Consult Match</h3>
                                <p className="btn-description">
                                    Algorithm-driven specialist pairing with board-certified professionals
                                </p>
                                <span className="btn-action">
                                    <FaSearch className="icon" />
                                    <FaStethoscope className="icon" />
                                    Find Doctors
                                </span>
                            </div>
                        </button>

                        <button className="feature-btn learning-btn">
                            <div className="btn-content">
                                <span className="audience-tag">Students/Residents</span>
                                <h3 className="btn-title">Clinical Nexus Academy</h3>
                                <p className="btn-description">
                                    Immersive case simulations and peer-to-peer grand rounds
                                </p>
                                <p className="btn-description">Access cases, quizzes, and mentor support</p>
                                <span className="btn-action-a">
                                    <FaBookOpen className="icon" />
                                    Start Learning
                                </span>
                            </div>
                        </button>

                        <button className="feature-btn discussion-btn">
                            <div className="btn-content">
                                <span className="audience-tag">For Doctors</span>
                                <h3 className="btn-title">Diagnostic Think Tank</h3>
                                <p className="btn-description">
                                    Crowd-sourced differential diagnoses with AI-powered pattern recognition
                                </p>
                                <span className="btn-action-c">
                                    <MdForum className="icon" />
                                    Join Discussions
                                </span>
                            </div>
                        </button>
                    </div>
                </section>

                <section className="medical-specialties">
                    <div className="container">
                        <h2 className="section-title">
                            <span className="highlight">Multidisciplinary</span> Expertise Network
                        </h2>
                        <p className="section-subtitle">
                            27 specialized fields | 500+ verified practitioners | Avg. 8min response time
                        </p>
                        <div className="specialties-grid">
                            {medicalSpecialties.map((specialty, i) => (
                                <SpecialtyCard
                                    key={specialty.name}
                                    specialty={specialty}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="learning hidden">
                    <h2 className="text-lavender-dark">
                        Medical Learning Hub & Clinical Cognition Engine
                    </h2>
                    <p className="section-description">
                        Transform theoretical knowledge into practical mastery through our
                        <span className="highlight">3D anatomy visualizer</span>,
                        <span className="highlight">live code review simulations</span>, and
                        <span className="highlight">resident mentorship pipelines</span>.
                    </p>
                    <div className="specialty-grid">
                        {medicalSpecialties.map((specialty, i) => (
                            <div
                                key={specialty.name}
                                className="learning-card hidden stagger"
                                data-delay={i * 0.1}
                                onClick={() => setActiveSpecialty(specialty)}
                            >
                                <div className={`learning-icon icon-${specialty.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {specialty.icon}
                                </div>
                                <h3>{specialty.name}</h3>
                                <div className="learning-resources">
                                    {specialty.cases.slice(0, 2).map((resource, index) => (
                                        <span key={index} className="resource-tag">
                                            {resource}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="appointments hidden">
                    <h2 className="text-sage-800">
                        Precision Care Coordination
                    </h2>
                    <p className="section-description">
                        Our <span className="highlight">Smart Match Algorithm</span> analyzes
                        12 clinical parameters to connect patients with ideal specialists,
                        reducing diagnostic odysseys by 68% (2024 clinical trial data).
                    </p>
                    <h2 className="text-sage-800">Book a Specialist</h2>
                    <div className="appointment-form">
                        <select
                            className="specialty-select"
                            onChange={(e) => setActiveSpecialty(medicalSpecialties.find(s => s.name === e.target.value))}
                        >
                            <option value="">Select Specialty</option>
                            {medicalSpecialties.map((specialty) => (
                                <option key={specialty.name} value={specialty.name}>
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                        {activeSpecialty && (
                            <div className="booking-details">
                                <div className="specialty-header">
                                    <div className={`specialty-icon icon-${activeSpecialty.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {activeSpecialty.icon}
                                    </div>
                                    <h3>{activeSpecialty.name} Consultation</h3>
                                </div>
                                <div className="consultation-info">
                                    <p><strong>Typical Cases:</strong> {activeSpecialty.cases.slice(0, 3).join(', ')}</p>
                                    <p><strong>Average Response Time:</strong> 2-4 hours</p>
                                    <p><strong>Consultation Fee:</strong> $120-250</p>
                                </div>
                                <button className="btn btn-lavender">
                                    Proceed to Payment
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <section className="testimonials hidden">
                    <h2>Voices of Trust</h2>
                    <p className="section-subtitle hidden">
                        Join 3,000+ medical professionals revolutionizing care
                    </p>

                    <div className="testimonial-carousel">
                        {testimonials.map((testimonial, i) => {
                            const userRating = userRatings[testimonial.author] || testimonial.rating;

                            return (
                                <div
                                    key={i}
                                    className="testimonial-card hidden stagger"
                                    data-delay={i * 0.2}
                                >
                                    <div className="testimonial-content">
                                        <div
                                            className={`testimonial-avatar ${hoveredAvatar === testimonial.author ? 'avatar-hover' : ''}`}
                                            onMouseEnter={() => setHoveredAvatar(testimonial.author)}
                                            onMouseLeave={() => setHoveredAvatar(null)}
                                        >
                                            <img
                                                src={testimonial.avatar}
                                                alt={testimonial.author}
                                                className="avatar-img"
                                            />
                                            {hoveredAvatar === testimonial.author && (
                                                <div className="avatar-tooltip">
                                                    {testimonial.author}
                                                </div>
                                            )}
                                        </div>

                                        <div className="rating-container">
                                            <div className="user-rating">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <FaStar
                                                        key={star}
                                                        className={`rating-star ${star <= userRating ? 'active' : ''}`}
                                                        onClick={() => handleRating(testimonial.author, star)}
                                                    />
                                                ))}
                                            </div>
                                            <span className="rating-text">
                                                {userRating}.0/5.0
                                            </span>
                                        </div>

                                        <p className="testimonial-quote">"{testimonial.quote}"</p>

                                        <div className="author">
                                            <span className={testimonial.badgeClass}>
                                                {testimonial.author}
                                            </span>
                                            <span className="author-role">{testimonial.role}</span>
                                        </div>
                                    </div>

                                    <div className="testimonial-footer">
                                        <button className="btn btn-lavender w-full hover-scale-102 transition-transform">
                                            <FaComments className="mr-2" />
                                            View Full Story
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-8">
                        <button className="btn btn-lavender px-8 py-3 rounded-lg hover-bg-opacity-90
                            transition-all duration-300 transform hover-translate-y-0.5 shadow-lg
                            bg-gradient-to-r from-purple-600 to-blue-500 text-white">
                            <FaComments className="mr-2" />
                            Share Your Story
                        </button>
                    </div>
                </section>
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className="settings-modal">
                    <div className="settings-content">
                        <button
                            className="close-settings"
                            onClick={() => setShowSettings(false)}
                        >
                            <FaTimes />
                        </button>

                        <h2>Customize Your Experience</h2>

                        <div className="settings-section">
                            <h3><FaUser /> Profile Settings</h3>
                            <div className="input-group">
                                <FaUser className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={authForm.username || currentUser?.username || ''}
                                    onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                                />
                            </div>

                            <div className="avatar-upload-section">
                                <label className="avatar-label">Profile Picture</label>
                                <div className="avatar-preview-container">
                                    {avatarPreview ? (
                                        <div className="avatar-preview">
                                            <img src={avatarPreview} alt="Avatar preview" />
                                            <button type="button" onClick={removeAvatar} className="remove-avatar">
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ) : currentUser?.avatar_url ? (
                                        <div className="avatar-preview">
                                            <img src={currentUser.avatar_url} alt="Current avatar" />
                                        </div>
                                    ) : (
                                        <div className="avatar-placeholder">
                                            <FaUserCircle />
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar-upload-settings" className="avatar-upload-btn">
                                    <FaImage /> Change Image
                                </label>
                                <input
                                    id="avatar-upload-settings"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <button
                                className="btn btn-lavender"
                                onClick={handleUpdateProfile}
                            >
                                Update Profile
                            </button>
                        </div>

                        <div className="settings-section">
                            <h3><FaPalette /> Appearance Settings</h3>

                            <div className="preference-group">
                                <label>Primary Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.primaryColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, primaryColor: e.target.value})}
                                />
                            </div>

                            <div className="preference-group">
                                <label>Secondary Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.secondaryColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, secondaryColor: e.target.value})}
                                />
                            </div>

                            <div className="preference-group">
                                <label>Background Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.backgroundColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, backgroundColor: e.target.value})}
                                />
                            </div>

                            <div className="preference-group">
                                <label>Text Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.textColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, textColor: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3><FaFont /> Typography Settings</h3>

                            <div className="preference-group">
                                <label>Font Size</label>
                                <select
                                    value={tempPreferences.fontSize}
                                    onChange={(e) => setTempPreferences({...tempPreferences, fontSize: e.target.value})}
                                >
                                    <option value="14px">Small</option>
                                    <option value="16px">Medium</option>
                                    <option value="18px">Large</option>
                                    <option value="20px">X-Large</option>
                                </select>
                            </div>

                            <div className="preference-group">
                                <label>Font Family</label>
                                <select
                                    value={tempPreferences.fontFamily}
                                    onChange={(e) => setTempPreferences({...tempPreferences, fontFamily: e.target.value})}
                                >
                                    <option value="system-ui, sans-serif">System UI</option>
                                    <option value="'Inter', sans-serif">Inter</option>
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                    <option value="'Open Sans', sans-serif">Open Sans</option>
                                    <option value="'Georgia', serif">Georgia</option>
                                </select>
                            </div>

                            <div className="preference-group">
                                <label>Border Radius</label>
                                <select
                                    value={tempPreferences.borderRadius}
                                    onChange={(e) => setTempPreferences({...tempPreferences, borderRadius: e.target.value})}
                                >
                                    <option value="0px">None</option>
                                    <option value="4px">Small</option>
                                    <option value="8px">Medium</option>
                                    <option value="12px">Large</option>
                                    <option value="16px">X-Large</option>
                                </select>
                            </div>
                        </div>

                        <div className="settings-actions">
                            <button
                                className="btn btn-sage"
                                onClick={handleSavePreferences}
                            >
                                <FaSave /> Save Preferences
                            </button>

                            <button
                                className="btn btn-secondary"
                                onClick={handleResetPreferences}
                            >
                                <FaUndo /> Reset to Default
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="auth-modal">
                    <div className="auth-content">
                        <button
                            className="close-auth"
                            onClick={() => {
                                setShowAuthModal(false);
                                setAuthError('');
                                setAuthSuccess('');
                                setAvatarFile(null);
                                setAvatarPreview(null);
                            }}
                        >
                            <FaTimes />
                        </button>

                        <h2>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>

                        {authError && <div className="auth-error">{authError}</div>}
                        {authSuccess && <div className="auth-success">{authSuccess}</div>}

                        <form onSubmit={handleAuth}>
                            {authMode === 'register' && (
                                <>
                                    <div className="input-group">
                                        <FaUser className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={authForm.username}
                                            onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                                            required
                                        />
                                    </div>

                                    {/* Avatar Upload */}
                                    <div className="avatar-upload-section">
                                        <label className="avatar-label">Profile Picture (Optional)</label>
                                        <div className="avatar-preview-container">
                                            {avatarPreview ? (
                                                <div className="avatar-preview">
                                                    <img src={avatarPreview} alt="Avatar preview" />
                                                    <button type="button" onClick={removeAvatar} className="remove-avatar">
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    <FaUserCircle />
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="avatar-upload" className="avatar-upload-btn">
                                            <FaImage /> Choose Image
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="input-group">
                                <FaEnvelope className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={authForm.email}
                                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <FaLock className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={authForm.password}
                                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                                    required
                                    minLength={6}
                                />
                            </div>

                            {authMode === 'register' && (
                                <div className="input-group">
                                    <FaLock className="input-icon" />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={authForm.confirmPassword}
                                        onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            )}

                            <button type="submit" className="auth-submit-btn">
                                {authMode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="auth-switch">
                            {authMode === 'login' ? (
                                <p>
                                    Don't have an account?{' '}
                                    <button onClick={() => {
                                        setAuthMode('register');
                                        setAuthError('');
                                        setAuthSuccess('');
                                    }}>
                                        Sign Up
                                    </button>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{' '}
                                    <button onClick={() => {
                                        setAuthMode('login');
                                        setAuthError('');
                                        setAuthSuccess('');
                                    }}>
                                        Sign In
                                    </button>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Toggle Button */}
            <button
                className="chat-toggle-btn"
                onClick={() => setShowChat(!showChat)}
            >
                <FaComments />
                {messages.length > 0 && <span className="message-indicator"></span>}
            </button>

            {/* Chat Modal */}
            {showChat && (
                <div className="chat-modal">
                    <div className="chat-header">
                        <h3>Community Chat</h3>
                        <button
                            className="close-chat"
                            onClick={() => setShowChat(false)}
                        >
                            <FaTimes />
                        </button>
                    </div>
                    <div className="messages-container">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.user_id === currentUser?.id ? 'own-message' : ''}`}
                            >
                                <div className="message-user">
                                    {message.user?.avatar_url ? (
                                        <img src={message.user.avatar_url} alt={message.user.username} className="message-avatar" />
                                    ) : (
                                        <FaUserCircle className="message-avatar-placeholder" />
                                    )}
                                    <span className="message-username">{message.user?.username || 'Anonymous'}</span>
                                </div>

                                {message.image_url && (
                                    <div className="message-image-container">
                                        <div
                                            className="message-image clickable-image"
                                            onClick={() => handleImageClick(message.image_url)}
                                        >
                                            <img src={message.image_url} alt="Shared content" />
                                            <div className="image-overlay">
                                                <FaImage className="enlarge-icon" />
                                                <span>Click to enlarge</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {message.text && <p className="message-text">{message.text}</p>}
                                {message.location && (
                                    <div className={`message-location-container ${message.text?.includes('🚨 EMERGENCY ALERT') ? 'emergency-location' : ''}`}>
                                        <div className="message-location-header">
                                            <FaMapMarkerAlt className="location-icon" />
                                            <span className="location-title">Location Shared</span>
                                        </div>
                                        <div className="location-details">
                                            <div className="location-address">
                                                {message.location.text?.split(' (')[0] || 'Address not available'}
                                            </div>
                                            <div className="location-coordinates">
                                                {message.location.text?.includes('Coordinates:')
                                                    ? message.location.text.match(/Coordinates: [^)]+/)[0]
                                                    : `Coordinates: ${message.location.latitude?.toFixed(6)}, ${message.location.longitude?.toFixed(6)}`
                                                }
                                            </div>
                                        </div>
                                        {message.location.accuracy && (
                                            <div className="location-accuracy">
                                                Accuracy: ±{Math.round(message.location.accuracy)} meters
                                            </div>
                                        )}
                                    </div>
                                )}
                                <span className="message-time">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="message-input">
                        {selectedImage && (
                            <div className="image-preview">
                                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                                <button onClick={removeImage} className="remove-image">
                                    <FaTimes />
                                </button>
                            </div>
                        )}
                        <div className="input-container">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isUploading}
                            />
                            <label htmlFor="image-upload" className="image-upload-btn">
                                <FaImage />
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                                disabled={isUploading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                                className="send-btn"
                            >
                                {isUploading ? <div className="spinner"></div> : <FaPaperPlane />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enlarged Image Modal */}
            {enlargedImage && (
                <div className="enlarged-image-modal" onClick={closeEnlargedImage}>
                    <div className="enlarged-image-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-enlarged-image" onClick={closeEnlargedImage}>
                            <FaTimes />
                        </button>

                        <div className="zoom-controls">
                            <button onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.25))}>
                                <FaSearchMinus />
                            </button>
                            <span>{Math.round(imageZoom * 100)}%</span>
                            <button onClick={() => setImageZoom(prev => Math.min(3, prev + 0.25))}>
                                <FaSearchPlus />
                            </button>
                            <button onClick={() => {
                                setImageZoom(1);
                                setImagePosition({ x: 0, y: 0 });
                            }}>
                                Reset
                            </button>
                        </div>

                        <div
                            className={`image-container ${imageZoom > 1 ? 'zoomed' : ''}`}
                            onWheel={handleImageWheel}
                            onMouseDown={handleImageMouseDown}
                            onMouseMove={handleImageMouseMove}
                            onMouseUp={handleImageMouseUp}
                            onMouseLeave={handleImageMouseUp}
                        >
                            <img
                                src={enlargedImage}
                                alt="Enlarged view"
                                style={{
                                    transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                                    cursor: imageZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                                }}
                            />
                        </div>

                        <div className="image-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => window.open(enlargedImage, '_blank')}
                            >
                                <FaImage /> Open in New Tab
                            </button>
                            <button className="btn btn-secondary" onClick={closeEnlargedImage}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="hidden">
                <div className="footer-content">
                    <div className="footer-brand">
                        <img
                            src="/logo.png"
                            alt="MediConnect"
                            className="footer-logo animate-pulse"
                        />
                    </div>

                    <div className="footer-links">
                        <div className="link-group">
                            <h4>Services</h4>
                            <a href="/learning">Learning Hub</a>
                            <a href="/appointments">Specialist Booking</a>
                            <a href="/emergency">Emergency Help</a>
                        </div>
                        <div className="link-group">
                            <h4>Community</h4>
                            <a href="/forums">Discussion Forums</a>
                            <a href="/mentorship">Mentorship</a>
                            <a href="/cases">Case Library</a>
                        </div>
                        <div className="link-group">
                            <h4>Legal</h4>
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/terms">Terms of Service</a>
                            <a href="/compliance">HIPAA Compliance</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2025 MEDICONNECT. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

// Medical Specialties Data with Professional Icons
const medicalSpecialties = [
    {
        name: 'General Medicine',
        icon: <FaUserMd />,
        color: '#3B82F6',
        description: 'Comprehensive adult health management',
        cases: ['Chronic disease care', 'Preventive screenings', 'Health maintenance']
    },
    {
        name: 'Radiology',
        icon: <FaXRay />,
        color: '#475569',
        description: 'Medical imaging and diagnostic interpretation',
        cases: ['MRI analysis', 'CT scan review', 'Ultrasound diagnostics']
    },
    {
        name: 'Cardiology',
        icon: <FaHeartbeat />,
        color: '#EF4444',
        description: 'Heart and circulatory system disorders',
        cases: ['Arrhythmia management', 'Heart failure care', 'Angina treatment']
    },
    {
        name: 'Neurology',
        icon: <FaBrain />,
        color: '#8B5CF6',
        description: 'Nervous system disorders treatment',
        cases: ['Epilepsy management', 'Stroke rehabilitation', 'MS care']
    },
    {
        name: 'Oncology',
        icon: <FaClinicMedical />,
        color: '#9333EA',
        description: 'Cancer diagnosis and treatment',
        cases: ['Chemotherapy planning', 'Radiation therapy', 'Tumor boards']
    },
    {
        name: 'Pediatrics',
        icon: <FaBaby />,
        color: '#F59E0B',
        description: 'Child health and development',
        cases: ['Vaccination schedules', 'Growth monitoring', 'Adolescent care']
    },
    {
        name: 'Orthopedics',
        icon: <FaBone />,
        color: '#6B7280',
        description: 'Musculoskeletal system care',
        cases: ['Fracture repair', 'Joint replacement', 'Sports injuries']
    },
    {
        name: 'Dermatology',
        icon: <FaUserAlt />,
        color: '#EC4899',
        description: 'Skin, hair and nail conditions',
        cases: ['Psoriasis treatment', 'Acne therapy', 'Skin cancer screening']
    },
    {
        name: 'Gastroenterology',
        icon: <GiStomach />,
        color: '#10B981',
        description: 'Digestive system disorders',
        cases: ['Colonoscopy screening', 'IBD management', 'Liver disease care']
    },
    {
        name: 'Endocrinology',
        icon: <FaSyringe />,
        color: '#F59E0B',
        description: 'Hormonal and metabolic disorders',
        cases: ['Diabetes management', 'Thyroid disorders', 'Osteoporosis care']
    },
    {
        name: 'Pulmonology',
        icon: <GiLungs />,
        color: '#3B82F6',
        description: 'Respiratory system health',
        cases: ['Asthma control', 'COPD management', 'Sleep apnea treatment']
    },
    {
        name: 'Nephrology',
        icon: <GiKidneys />,
        color: '#10B981',
        description: 'Kidney disease management',
        cases: ['Dialysis planning', 'Hypertension care', 'Transplant coordination']
    },
    {
        name: 'Hematology',
        icon: <FaMicroscope />,
        color: '#DC2626',
        description: 'Blood disorders treatment',
        cases: ['Anemia management', 'Leukemia care', 'Coagulation disorders']
    },
    {
        name: 'Rheumatology',
        icon: <FaProcedures />,
        color: '#8B5CF6',
        description: 'Autoimmune and joint diseases',
        cases: ['Arthritis management', 'Lupus care', 'Osteoporosis treatment']
    },
    {
        name: 'Infectious Diseases',
        icon: <FaAllergies />,
        color: '#9333EA',
        description: 'Complex infection management',
        cases: ['Antibiotic therapy', 'HIV care', 'Travel medicine']
    },
    {
        name: 'Emergency Medicine',
        icon: <MdEmergency />,
        color: '#DC2626',
        description: 'Acute care and trauma response',
        cases: ['Trauma stabilization', 'Cardiac arrest care', 'Toxicology']
    },
    {
        name: 'Family Medicine',
        icon: <FaUserMd />,
        color: '#3B82F6',
        description: 'Comprehensive family health care',
        cases: ['Preventive care', 'Chronic disease management', 'Health screenings']
    },
    {
        name: 'Psychiatry',
        icon: <MdPsychology />,
        color: '#10B981',
        description: 'Mental health and behavioral care',
        cases: ['Depression treatment', 'Anxiety management', 'Behavioral therapy']
    },
    {
        name: 'Obstetrics/Gynecology',
        icon: <FaProcedures />,
        color: '#EC4899',
        description: 'Women\'s reproductive health',
        cases: ['Prenatal care', 'Menopause management', 'Gynecologic surgery']
    },
    {
        name: 'Urology',
        icon: <GiKidneys />,
        color: '#3F51B5',
        description: 'Urinary tract and male reproductive health',
        cases: ['Prostate care', 'Kidney stones treatment', 'Incontinence management']
    },
    {
        name: 'Ophthalmology',
        icon: <FaEye />,
        color: '#6366F1',
        description: 'Eye care and vision health',
        cases: ['Cataract surgery', 'Glaucoma management', 'Retinal care']
    },
    {
        name: 'Otolaryngology',
        icon: <FaHeadSideCough />,
        color: '#6B7280',
        description: 'Ear, nose and throat disorders',
        cases: ['Hearing loss management', 'Sinusitis treatment', 'Voice disorders']
    },
    {
        name: 'Anesthesiology',
        icon: <FaSyringe />,
        color: '#8B5CF6',
        description: 'Pain management and surgical support',
        cases: ['Surgical anesthesia', 'Pain control', 'Critical care support']
    },
    {
        name: 'Pathology',
        icon: <FaMicroscope />,
        color: '#475569',
        description: 'Disease diagnosis through laboratory analysis',
        cases: ['Biopsy interpretation', 'Genetic testing', 'Forensic pathology']
    },
    {
        name: 'Surgery',
        icon: <FaProcedures />,
        color: '#DC2626',
        description: 'Operative treatment of injuries/diseases',
        cases: ['Minimally invasive surgery', 'Trauma surgery', 'Surgical oncology']
    }
];

const testimonials = [
    {
        quote: "This platform has transformed how we handle emergency cases. The real-time collaboration features are game-changing.",
        author: 'Dr. Sarah Johnson',
        role: 'Emergency Physician',
        specialty: 'Emergency Medicine',
        badgeClass: 'role-badge doctor-badge',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        rating: 5
    },
    {
        quote: "As a medical student, the interactive learning modules have been invaluable for my clinical rotations preparation.",
        author: 'Michael Chen',
        role: 'Medical Student',
        specialty: 'Medical Education',
        badgeClass: 'role-badge student-badge',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        rating: 5
    },
    {
        quote: "The specialist matching algorithm saved us crucial time in diagnosing a rare autoimmune condition.",
        author: 'Dr. Emily Smith',
        role: 'Rheumatologist',
        specialty: 'Rheumatology',
        badgeClass: 'role-badge patient-badge',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        rating: 4
    },
    {
        quote: "Our rural clinic benefits immensely from the telemedicine capabilities. It's like having specialists on call 24/7.",
        author: 'Nurse James Wilson',
        role: 'Head Nurse',
        specialty: 'Family Medicine',
        badgeClass: 'role-badge doctor-badge',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        rating: 5
    },
    {
        quote: "The surgical simulation tools have dramatically improved our residency training program's effectiveness.",
        author: 'Dr. Maria Gonzalez',
        role: 'Surgical Resident',
        specialty: 'Surgery',
        badgeClass: 'role-badge student-badge',
        avatar: 'https://randomuser.me/api/portraits/women/72.jpg',
        rating: 5
    }
];

export default App;