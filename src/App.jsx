import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { 
  FaStethoscope, FaHeartbeat, FaBrain, FaBaby, FaBone, FaClinicMedical,
  FaUserMd, FaXRay, FaBookMedical, FaFirstAid, FaProcedures, FaMicroscope,
  FaEye, FaAllergies, FaSyringe, FaSearch, FaBookOpen, FaComments, FaStar,
  FaChevronDown, FaChevronUp, FaPaperPlane, FaImage, FaTimes, FaUser, FaEnvelope,
  FaLock, FaMapMarkerAlt, FaSignInAlt
} from 'react-icons/fa';
import { FaCut, FaUserAlt, FaRegUser, FaHeadSideCough } from 'react-icons/fa';
import { GiKidneys, GiLungs, GiSpiderWeb, GiStomach } from 'react-icons/gi';
import { MdPsychology, MdEmergency, MdForum } from 'react-icons/md';
import './specialty.css';
import './index.css';

// Initialize Supabase client with error handling
let supabase;
try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables are not set. Using mock client.');
    throw new Error('Supabase environment variables not set');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a mock supabase client for development
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      signUp: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
      on: () => ({ subscribe: () => {} })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: null } })
      })
    }
  };
}

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
  const [supabaseError, setSupabaseError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50;
      setIsBottom(bottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setSupabaseError('Failed to connect to authentication service');
          createAnonymousUser();
          return;
        }
        
        if (session) {
          setCurrentUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          createAnonymousUser();
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        createAnonymousUser();
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session) {
            setCurrentUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            createAnonymousUser();
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
      
      const subscription = supabase
        .from('messages')
        .on('INSERT', (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
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

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
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
        setSupabaseError('Failed to load messages');
      } else {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };

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
      
      const { error } = await supabase
        .from('messages')
        .insert([
          { 
            user_id: currentUser.id,
            text: 'EMERGENCY ALERT - Need immediate assistance!',
            location: location,
            created_at: new Date()
          }
        ]);
      
      if (error) {
        console.error('Error sending emergency alert:', error);
        alert('Emergency alert sent locally!');
      } else {
        alert(`Emergency alert sent! Location: ${location.latitude}, ${location.longitude}`);
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

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'register') {
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match');
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
          try {
            await supabase
              .from('users')
              .insert([
                {
                  id: data.user.id,
                  username: authForm.username,
                  email: authForm.email
                }
              ]);
          } catch (dbError) {
            console.error('Error creating user profile:', dbError);
          }
          
          setShowAuthModal(false);
          setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
        }
      } catch (error) {
        setAuthError('Authentication service unavailable');
      }
    } else {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password
        });

        if (error) {
          setAuthError(error.message);
        } else {
          setShowAuthModal(false);
          setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
        }
      } catch (error) {
        setAuthError('Authentication service unavailable');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    
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
            created_at: new Date()
          }
        ]);
      
      if (error) {
        console.error('Error sending message:', error);
        setSupabaseError('Failed to send message');
      } else {
        setNewMessage('');
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error in send message:', error);
      setSupabaseError('Failed to send message');
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

  return (
    <div className="app">
      {/* Supabase Connection Error Banner */}
      {supabaseError && (
        <div className="supabase-error-banner">
          <span>{supabaseError}</span>
          <button onClick={() => setSupabaseError('')}>×</button>
        </div>
      )}

      <a href="/" className="logo-container hidden">
        <img src="/logo-w1.png" alt="MediConnect" className="logo-img animate-pulse" />
        <span className="logo-text gradient-text">MediConnect</span>
      </a>
      
      <nav className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
        <div 
          className={`nav-content ${isMenuOpen ? 'visible' : ''}`}
        >
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
            <a href="/login" className="btn btn-sage">
              Professional Login <span className="notification-bubble">2</span>
            </a>
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

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal">
          <div className="auth-content">
            <button 
              className="close-auth"
              onClick={() => setShowAuthModal(false)}
            >
              <FaTimes />
            </button>
            
            <h2>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>
            
            {authError && <div className="auth-error">{authError}</div>}
            
            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
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
                  <button onClick={() => setAuthMode('register')}>
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')}>
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Auth Button */}
      <div className="user-auth-container">
        {currentUser && !currentUser.anonymous ? (
          <button className="user-profile-btn" onClick={handleSignOut}>
            <FaUser /> Sign Out
          </button>
        ) : (
          <button 
            className="user-auth-btn"
            onClick={() => {
              setShowAuthModal(true);
              setAuthMode('login');
            }}
          >
            <FaSignInAlt /> Sign In
          </button>
        )}
      </div>

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
                {message.image_url && (
                  <div className="message-image">
                    <img src={message.image_url} alt="Shared content" />
                  </div>
                )}
                {message.text && <p>{message.text}</p>}
                {message.location && (
                  <div className="message-location">
                    <FaMapMarkerAlt />
                    <span>Location shared</span>
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

const features = [
  {
    icon: '🆘',
    audience: 'For Everyone',
    title: 'Emergency Alert',
    description: 'Instant help request with GPS location',
    color: 'red',
    badgeColor: 'emergency-badge',
    buttonText: 'Trigger Alert',
    buttonColor: 'red'
  },
  {
    icon: '📅',
    audience: 'For Patients',
    title: 'Book a Specialist',
    description: 'Schedule paid appointments by specialty',
    color: 'lavender',
    badgeColor: 'patient-badge',
    buttonText: 'Find Doctors',
    buttonColor: 'lavender'
  },
  {
    icon: '🎓',
    audience: 'Students/Residents',
    title: 'Learning Hub',
    description: 'Access cases, quizzes, and mentor support',
    color: 'sage',
    badgeColor: 'student-badge',
    buttonText: 'Start Learning',
    buttonColor: 'sage'
  },
  {
    icon: '💬',
    audience: 'For Doctors',
    title: 'Case Discussions',
    description: 'Share knowledge and mentor trainees',
    color: 'blue',
    badgeColor: 'doctor-badge',
    buttonText: 'Join Discussions',
    buttonColor: 'blue'
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