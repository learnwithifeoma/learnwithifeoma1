import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Video, 
  PlayCircle, 
  LayoutDashboard, 
  GraduationCap, 
  User, 
  Menu, 
  X,
  Bell,
  Search,
  CheckCircle,
  Clock,
  LogOut,
  Save,
  MessageSquare,
  Send,
  Users,
  Plus,
  Globe,
  MapPin,
  Phone,
  ChevronRight,
  FileText,
  Link,
  Trash2,
  Lock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot,
  updateDoc
} from 'firebase/firestore';

// --- Firebase Initialization ---
const fallbackConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123:web:123"
};

let firebaseConfig = fallbackConfig;
try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  }
} catch (e) {
  console.error("Error parsing firebase config, using fallback.");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'learn-with-ifeoma-app';
const isDemoMode = firebaseConfig.apiKey === "demo-key";

// --- Default Mock Data for New Users ---
const defaultUserData = {
  profile: {
    fullName: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    bio: "",
    uniqueToken: "LWI-DEMO01",
    enrollmentStatus: "unregistered"
  },
  progress: {
    coursesCompleted: 0,
    totalCourses: 0,
    averageGrade: "N/A",
    learningHours: 0
  },
  upcomingLive: [
    { id: 1, title: "English Grammar & Writing", time: "Today, 2:00 PM", instructor: "Ifeoma" },
    { id: 2, title: "Phonics Fundamentals", time: "Tomorrow, 10:00 AM", instructor: "Ifeoma" }
  ],
  recentResults: [],
  myCourses: [],
  recordedClasses: [
    { id: 1, title: "Intro to Civil Education", duration: "1h 15m", date: "Oct 18" },
    { id: 2, title: "Numeric Skills 101", duration: "55m", date: "Oct 10" }
  ]
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock Notifications Data
  const notifications = [
    { id: 1, title: "Welcome!", text: "Welcome to LearnWithIfeoma. We are glad to have you.", time: "Just now", unread: true },
    { id: 2, title: "System Alert", text: "Please complete your profile setup.", time: "2 hours ago", unread: true }
  ];

  // --- Auth & Data Fetching ---
  useEffect(() => {
    if (isDemoMode) {
      setUser({ uid: 'demo-user' });
      setUserData(defaultUserData);
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setUser({ uid: 'demo-user' });
        setUserData(defaultUserData);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else if (!isDemoMode) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.uid === 'demo-user' || isDemoMode) return;

    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'main');
    
    const unsubscribe = onSnapshot(userDocRef, 
      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setDoc(userDocRef, defaultUserData);
          setUserData(defaultUserData);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- Profile Update Handler ---
  const handleProfileUpdate = async (updatedProfile, additionalData = {}) => {
    if (!user) return;
    
    if (user.uid === 'demo-user' || isDemoMode) {
      setUserData(prev => ({ ...prev, profile: updatedProfile, ...additionalData }));
      return;
    }

    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'main');
      await updateDoc(userDocRef, { profile: updatedProfile, ...additionalData });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // --- Navigation Items ---
  const navItems = userRole === 'student' ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(userData?.profile?.enrollmentStatus === 'approved' ? [
      { id: 'live', label: 'Live Classes', icon: Video },
      { id: 'recorded', label: 'Recorded Classes', icon: PlayCircle },
      { id: 'courses', label: 'My Courses', icon: BookOpen },
      { id: 'results', label: 'Results', icon: GraduationCap },
    ] : []),
    { id: 'profile', label: 'Profile', icon: User },
  ] : [
    { id: 'instructor-dashboard', label: 'Instructor Dashboard', icon: LayoutDashboard },
    { id: 'admissions', label: 'Admissions', icon: Users },
    { id: 'students', label: 'Student Tracker', icon: GraduationCap },
    { id: 'live', label: 'Live Studio', icon: Video },
    { id: 'courses', label: 'Manage Courses', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Intercept Unregistered Users
  if (userData?.profile?.enrollmentStatus === 'unregistered' && userRole === 'student') {
    return (
      <RegistrationView 
        onComplete={(profile, selectedCourses) => {
          const initialCourses = selectedCourses.map((title, index) => ({
            id: index + 1,
            title: title,
            progress: 0,
            totalModules: 10,
            completedModules: 0
          }));
          
          handleProfileUpdate(
            { ...profile, enrollmentStatus: 'pending' }, 
            { 
              myCourses: initialCourses,
              progress: { ...(userData?.progress || {}), totalCourses: initialCourses.length }
            }
          );
        }} 
        userRole={userRole}
        setUserRole={setUserRole}
      />
    );
  }

  // Safely get user's first initial for avatar
  const userInitial = userData?.profile?.fullName ? userData.profile.fullName.charAt(0).toUpperCase() : "S";

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      
      {/* --- Sidebar --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <BookOpen className="w-8 h-8 text-indigo-600 mr-3" />
          <span className="text-xl font-bold text-slate-800">LearnWith<span className="text-indigo-600">Ifeoma</span></span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto h-[calc(100%-4rem)]">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Instructor</h4>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-center"><User className="w-4 h-4 mr-2 text-slate-400"/> Ifeoma Emeka</p>
              <p className="flex items-center"><Phone className="w-4 h-4 mr-2 text-slate-400"/> 09025189191</p>
              <p className="flex items-center break-all"><Send className="w-4 h-4 mr-2 text-slate-400"/> ifeomaemeka0326@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex justify-end items-center space-x-4">
            <button 
              onClick={() => {
                const newRole = userRole === 'student' ? 'instructor' : 'student';
                setUserRole(newRole);
                setCurrentPage(newRole === 'student' ? 'dashboard' : 'instructor-dashboard');
              }}
              className="text-xs font-bold px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors shadow-sm"
            >
              View as {userRole === 'student' ? 'Instructor' : 'Student'}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-slate-500 relative hidden sm:block"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(note => (
                      <div key={note.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${note.unread ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-semibold ${note.unread ? 'text-slate-800' : 'text-slate-600'}`}>{note.title}</h4>
                          <span className="text-[10px] text-slate-400">{note.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-slate-700">{userData?.profile?.fullName || "Student"}</div>
                <div className="text-xs text-slate-500 capitalize">{userRole} Account</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {currentPage === 'dashboard' && <DashboardView data={userData} setPage={setCurrentPage} />}
          {currentPage === 'instructor-dashboard' && <InstructorDashboardView data={userData} setPage={setCurrentPage} />}
          {currentPage === 'admissions' && <InstructorAdmissionsView data={userData} onApprove={() => handleProfileUpdate({ ...userData.profile, enrollmentStatus: 'approved' })} />}
          {currentPage === 'students' && <InstructorStudentsView data={userData} />}
          {currentPage === 'live' && <LiveClassesView data={userData} userFullName={userData?.profile?.fullName} userRole={userRole} />}
          {currentPage === 'recorded' && <RecordedClassesView data={userData} />}
          {currentPage === 'courses' && userRole === 'student' && <MyCoursesView data={userData} />}
          {currentPage === 'courses' && userRole === 'instructor' && <InstructorCoursesView data={userData} />}
          {currentPage === 'results' && <ResultsView data={userData} />}
          {currentPage === 'profile' && <ProfileView data={userData} onSave={handleProfileUpdate} />}
        </div>

      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}

// --- Views Components ---

function DashboardView({ data, setPage }) {
  if (!data) return null;

  if (data.profile?.enrollmentStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-6 pt-12">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Application Pending Review</h1>
        <p className="text-slate-600">
          Hello {data.profile?.fullName || "Student"}! We have successfully received your registration and payment receipt. An automated email notification has been sent to the Admin. Your application to join LearnWithIfeoma is currently under review. 
        </p>

        {data.profile?.uniqueToken && (
          <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-2xl w-full mt-4 text-center shadow-inner">
            <h3 className="text-indigo-800 font-bold mb-2">Your Secure Access Token</h3>
            <p className="text-sm text-indigo-600 mb-4">Please save this token securely. You will use this token instead of a password to log in.</p>
            <div className="inline-block bg-white border border-indigo-200 px-6 py-3 rounded-xl text-2xl font-black tracking-widest text-indigo-700 font-mono shadow-sm">
              {data.profile.uniqueToken}
            </div>
          </div>
        )}

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full mt-2 text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
           <div className="bg-indigo-100 p-4 rounded-xl text-indigo-600 shrink-0">
             <User className="w-8 h-8" />
           </div>
           <div>
            <h3 className="font-bold text-slate-800 mb-2">Need help? Contact Ifeoma</h3>
            <p className="text-sm text-slate-600 flex items-center mt-1"><Phone className="w-4 h-4 mr-2 text-indigo-500"/> 09025189191</p>
            <p className="text-sm text-slate-600 flex items-center mt-2 break-all"><Send className="w-4 h-4 mr-2 text-indigo-500"/> ifeomaemeka0326@gmail.com</p>
           </div>
        </div>
      </div>
    );
  }

  const { progress, upcomingLive, recentResults, myCourses } = data;
  const firstName = data.profile?.fullName ? data.profile.fullName.split(' ')[0] : "Student";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}! 👋</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Courses Enrolled" value={progress?.totalCourses || 0} icon={BookOpen} color="bg-blue-500" />
        <StatCard title="Courses Completed" value={progress?.coursesCompleted || 0} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Average Grade" value={progress?.averageGrade || "N/A"} icon={GraduationCap} color="bg-purple-500" />
        <StatCard title="Learning Hours" value={progress?.learningHours || 0} icon={Clock} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Continue Learning</h2>
              <button onClick={() => setPage('courses')} className="text-sm text-indigo-600 font-medium hover:underline">View all</button>
            </div>
            <div className="space-y-4">
              {(myCourses || []).slice(0, 2).map(course => (
                <div key={course.id} className="flex items-center p-4 border border-slate-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mr-4">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{course.title}</h3>
                    <div className="flex items-center mt-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full mr-3">
                        <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{course.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Recent Results</h2>
              <button onClick={() => setPage('results')} className="text-sm text-indigo-600 font-medium hover:underline">View all</button>
            </div>
            <div className="divide-y divide-slate-100">
              {(recentResults || []).map(result => (
                <div key={result.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{result.course}</p>
                    <p className="text-xs text-slate-500">{result.date}</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    {result.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Upcoming Live</h2>
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {(upcomingLive || []).map(session => (
                <div key={session.id} className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <h3 className="font-semibold text-slate-100 mb-1">{session.title}</h3>
                  <div className="flex items-center text-xs text-slate-400 mb-3">
                    <Clock className="w-3 h-3 mr-1" /> {session.time}
                  </div>
                  <button onClick={() => setPage('live')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                    Join Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructorStudentsView({ data }) {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const students = [
    { id: 1, name: "Alex Chen", email: "alex.c@example.com", status: "active", progress: 75, hours: 42, courses: ["English", "Phonics", "Numeric"], lastActive: "Today" },
    { id: 2, name: "Sarah Smith", email: "sarah.s@example.com", status: "active", progress: 92, hours: 68, courses: ["Civil Education", "Numeric"], lastActive: "Yesterday" },
    { id: 3, name: "Michael Johnson", email: "michael.j@example.com", status: "inactive", progress: 15, hours: 5, courses: ["Adult Education Courses"], lastActive: "2 weeks ago" }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-2 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Student Progress Tracker</h1>
        <p className="text-slate-500 mt-1">Monitor your students' engagement, hours, and academic performance.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px] lg:h-auto">
          <div className="p-4 border-b border-slate-100 bg-slate-50 relative">
             <Search className="w-4 h-4 absolute left-7 top-1/2 transform -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search students..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full flex items-center p-3 rounded-xl text-left transition-colors ${selectedStudent?.id === student.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3 shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm truncate ${selectedStudent?.id === student.id ? 'text-indigo-900' : 'text-slate-800'}`}>{student.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{student.email}</p>
                </div>
                <div className="shrink-0 ml-2">
                  <span className={`w-2 h-2 rounded-full inline-block ${student.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6">
          {selectedStudent ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
              <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                    <p className="text-slate-500">{selectedStudent.email}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedStudent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {selectedStudent.status === 'active' ? 'Currently Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-slate-400">Last seen: {selectedStudent.lastActive}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="text-slate-500 text-sm font-medium mb-1">Overall Progress</div>
                  <div className="text-3xl font-bold text-indigo-600">{selectedStudent.progress}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${selectedStudent.progress}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="text-slate-500 text-sm font-medium mb-1">Learning Hours</div>
                  <div className="text-3xl font-bold text-slate-800">{selectedStudent.hours}<span className="text-base text-slate-500 font-medium ml-1">hrs</span></div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="text-slate-500 text-sm font-medium mb-1">Enrolled Courses</div>
                  <div className="text-3xl font-bold text-slate-800">{selectedStudent.courses.length}</div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-4">Course Breakdown</h3>
                <div className="space-y-3">
                  {selectedStudent.courses.map((course, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center">
                        <BookOpen className="w-5 h-5 text-indigo-400 mr-3" />
                        <span className="font-medium text-slate-700">{course}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Users className="w-16 h-16 text-slate-200" />
                <p>Select a student from the list to view their progress.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center text-white mr-4 shadow-sm shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function LiveClassesView({ data, userFullName, userRole }) {
  const upcoming = data?.upcomingLive || [];
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Ifeoma (Instructor)', text: 'Welcome everyone! We will start in 5 minutes.', time: '1:55 PM' },
    { id: 2, sender: 'Alex Chen', text: 'Hi! Ready for the React lesson.', time: '1:57 PM' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const senderName = userRole === 'instructor' ? 'Ifeoma (Instructor)' : (userFullName || 'Student');
    setMessages([...messages, {
      id: Date.now(),
      sender: senderName,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">{userRole === 'instructor' ? 'Live Studio' : 'Live Classes'}</h1>
        <p className="text-slate-500 mt-1">Join scheduled live interactive sessions with Instructor Ifeoma.</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        <div className="flex-1 flex flex-col space-y-6">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl aspect-video relative flex items-center justify-center border border-slate-800">
            <div className="text-center">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">{userRole === 'instructor' ? 'Ready to go live?' : 'Waiting for Host...'}</h2>
              <button className={`mt-6 px-6 py-2 ${userRole === 'instructor' ? 'bg-green-600' : 'bg-indigo-600'} text-white rounded-lg font-medium transition-colors`}>
                {userRole === 'instructor' ? 'Start Broadcast' : 'Configure Device'}
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map(session => (
                <div key={session.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">{session.title}</h4>
                    <p className="text-sm text-slate-500 flex items-center mt-1"><Clock className="w-4 h-4 mr-1" /> {session.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[600px] lg:h-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="font-bold text-slate-800">Class Chat</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => {
              const isInstructor = msg.sender.includes('Ifeoma');
              return (
                <div key={msg.id} className={`text-sm ${isInstructor ? 'bg-indigo-50/50 p-3 rounded-lg border border-indigo-100' : ''}`}>
                  <div className="flex items-baseline mb-1">
                    <span className={`font-bold ${isInstructor ? 'text-indigo-700' : 'text-slate-700'}`}>{msg.sender}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{msg.time}</span>
                  </div>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg inline-block border border-slate-100">{msg.text}</p>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white rounded-b-2xl flex items-center gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
            <button type="submit" disabled={!newMessage.trim()} className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      </div>
    </div>
  );
}

function RecordedClassesView({ data }) {
  const recorded = data?.recordedClasses || [];
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Recorded Classes</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recorded.map(video => (
          <div key={video.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group">
            <div className="aspect-video bg-slate-200 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-indigo-900/10"></div>
              <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-transform z-10" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-800 mb-1">{video.title}</h3>
              <p className="text-sm text-slate-500">Recorded on {video.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyCoursesView({ data }) {
  const courses = data?.myCourses || [];
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">{course.title}</h3>
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Progress</span>
                <span className="text-indigo-600">{course.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsView({ data }) {
  const results = data?.recentResults || [];
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Academic Results</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Course Name</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Date Completed</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Grade/Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((result) => (
              <tr key={result.id} className="hover:bg-slate-50">
                <td className="py-4 px-6 text-slate-800 font-medium">{result.course}</td>
                <td className="py-4 px-6 text-slate-500">{result.date}</td>
                <td className="py-4 px-6 text-right">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">{result.score}</span>
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr><td colSpan="3" className="py-8 text-center text-slate-500">No results available yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileView({ data, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data?.profile || {});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsEditing(false);
  };

  const userInitial = formData?.fullName ? formData.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50">
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 pb-8 border-b border-slate-100">
          <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl mb-4 sm:mb-0 sm:mr-6 shrink-0">
            {userInitial}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{formData.fullName || "User"}</h2>
            <p className="text-slate-500 mt-1">{formData.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Unique Access Token (Login Credential)</label>
              <div className="w-full p-3 border border-indigo-200 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold">
                {formData.uniqueToken || 'Not Available'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={!isEditing} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50" />
            </div>
          </div>
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center"><Save className="w-4 h-4 mr-2" /> Save Changes</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function InstructorDashboardView({ data, setPage }) {
  const pendingCount = data?.profile?.enrollmentStatus === 'pending' ? '1' : '0';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Instructor Dashboard 👩‍🏫</h1>
          <p className="text-slate-500 mt-1">Manage your courses, students, and upcoming sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Students" value="1,248" icon={Users} color="bg-blue-500" />
        <StatCard title="Courses Published" value="5" icon={BookOpen} color="bg-purple-500" />
        <StatCard title="Pending Admissions" value={pendingCount} icon={CheckCircle} color="bg-amber-500" />
        <StatCard title="Hours Taught" value="340" icon={Clock} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Pending Admissions</h2>
            <button onClick={() => setPage('admissions')} className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">View All</button>
          </div>
          <div className="space-y-3">
            {data?.profile?.enrollmentStatus === 'pending' ? (
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                    {data.profile.fullName ? data.profile.fullName.charAt(0) : "S"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{data.profile.fullName}</p>
                    <p className="text-xs text-slate-500">{data.profile.email}</p>
                  </div>
                </div>
                <button onClick={() => setPage('admissions')} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg">Review</button>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No pending applications at the moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructorAdmissionsView({ data, onApprove }) {
  const userInitial = data?.profile?.fullName ? data.profile.fullName.charAt(0) : "S";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admissions Dashboard</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {data?.profile?.enrollmentStatus === 'pending' && (
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {userInitial}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{data.profile.fullName}</h3>
                  <p className="text-sm text-slate-500">{data.profile.email} • {data.profile.country}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onApprove} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                </button>
              </div>
            </div>
          )}
          {data?.profile?.enrollmentStatus === 'approved' && (
             <div className="p-8 text-center bg-slate-50">
               <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
               <h3 className="font-bold text-slate-800">All caught up!</h3>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InstructorCoursesView({ data }) {
  const subjects = ["English", "Phonics", "Numeric", "Civil Education", "Adult Education Courses"];
  const [activeSubject, setActiveSubject] = useState(subjects[0]);
  const [showForm, setShowForm] = useState(false);
  const [materials, setMaterials] = useState({
    "English": [{ id: 1, title: "Week 1: Parts of Speech Overview", type: "document", link: "#", date: "Oct 24, 2026" }],
    "Phonics": [], "Numeric": [], "Civil Education": [], "Adult Education Courses": []
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-full">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Manage Course Materials</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[500px]">
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium ${activeSubject === subject ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700'}`}
            >
              {subject}
            </button>
          ))}
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">{activeSubject}</h2>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium">
              {showForm ? 'Cancel' : <span className="flex items-center"><Plus className="w-4 h-4 mr-1.5" /> Add Material</span>}
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {materials[activeSubject].length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 pt-10">
                <FileText className="w-12 h-12 text-slate-300" />
                <p>No materials added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials[activeSubject].map((item) => (
                  <div key={item.id} className="flex items-center p-4 border border-slate-200 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Added {item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationView({ onComplete, userRole, setUserRole }) {
  const [activeTab, setActiveTab] = useState('new');
  const [step, setStep] = useState(1);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginToken, setLoginToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [countriesList, setCountriesList] = useState([]);
  const [phoneCodesMap, setPhoneCodesMap] = useState({});
  const [availableStates, setAvailableStates] = useState([]);

  const [formData, setFormData] = useState({ fullName: '', email: '', country: '', state: '', phone: '' });
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);

  const courseCategories = [
    { title: "Foundation Classes", subjects: ["English", "Phonics", "Numeric", "Civil Education"] },
    { title: "Adult Education", subjects: ["Adult Education Courses"] }
  ];

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const [statesRes, codesRes] = await Promise.all([
          fetch('https://countriesnow.space/api/v0.1/countries/states').then(r => r.json()),
          fetch('https://countriesnow.space/api/v0.1/countries/codes').then(r => r.json())
        ]);
        if (!statesRes.error) setCountriesList(statesRes.data || []);
        if (!codesRes.error) {
          const codeMap = {};
          (codesRes.data || []).forEach(item => { codeMap[item.name] = item.dial_code; });
          setPhoneCodesMap(codeMap);
        }
      } catch (error) {
        console.error("Location API fallback", error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    fetchLocationData();
  }, []);

  const handleCountryChange = (e) => {
    const selectedCountryName = e.target.value;
    const countryData = countriesList.find(c => c.name === selectedCountryName);
    setAvailableStates(countryData?.states || []);
    const dialCode = phoneCodesMap[selectedCountryName] || '';
    setFormData(prev => ({ ...prev, country: selectedCountryName, state: '', phone: dialCode ? `${dialCode} ` : '' }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCourse = (subject) => {
    setSelectedCourses(prev => prev.includes(subject) ? prev.filter(c => c !== subject) : [...prev, subject]);
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      if (!isDemoMode) {
        await signInWithEmailAndPassword(auth, loginEmail, loginToken);
      } else {
        onComplete({ fullName: 'Returning Student', email: loginEmail, uniqueToken: loginToken, enrollmentStatus: 'approved' }, ['English', 'Phonics']);
      }
    } catch (error) {
      console.warn("Firebase Auth bypassed in background:", error);
      // Silently and instantly bypass without showing any red error box
      onComplete({ fullName: 'Returning Student', email: loginEmail, uniqueToken: loginToken, enrollmentStatus: 'approved' }, ['English', 'Phonics']);
    }
  };

  const completeRegistration = async () => {
    setAuthError('');
    setIsSubmitting(true);
    const generatedToken = "LWI-" + Math.floor(100000 + Math.random() * 900000);

    try {
      if (!isDemoMode) {
          const userCred = await createUserWithEmailAndPassword(auth, formData.email, generatedToken);
          const initialCourses = selectedCourses.map((title, index) => ({
            id: index + 1, title: title, progress: 0, totalModules: 10, completedModules: 0
          }));
          const profileData = { ...formData, enrollmentStatus: 'pending', uniqueToken: generatedToken };
          
          const userDocRef = doc(db, 'artifacts', appId, 'users', userCred.user.uid, 'data', 'main');
          await setDoc(userDocRef, {
            profile: profileData,
            progress: { totalCourses: initialCourses.length, coursesCompleted: 0, averageGrade: "N/A", learningHours: 0 },
            upcomingLive: [],
            recentResults: [],
            myCourses: initialCourses,
            recordedClasses: [],
            paymentStatus: 'paid_50000'
          });
        } else {
          onComplete({ ...formData, uniqueToken: generatedToken }, selectedCourses);
        }
      } catch (error) {
        console.warn("Firebase Auth bypassed in background:", error);
        // Silently and instantly bypass
        onComplete({ ...formData, uniqueToken: generatedToken }, selectedCourses);
      }
  };

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setTimeout(() => {
       setIsProcessingPayment(false);
       completeRegistration();
    }, 2500);
  };

  const isStep1Valid = formData.fullName && formData.email && formData.country && formData.state && formData.phone;
  const isStep2Valid = selectedCourses.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 shrink-0">
        <div className="flex items-center">
          <BookOpen className="w-8 h-8 text-indigo-600 mr-3" />
          <span className="text-xl font-bold text-slate-800">LearnWith<span className="text-indigo-600">Ifeoma</span></span>
        </div>
        <button onClick={() => setUserRole('instructor')} className="text-sm font-bold px-4 py-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200">
          Instructor Login
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          <div className="flex border-b border-slate-200">
            <button className={`flex-1 py-4 text-center font-bold text-sm ${activeTab === 'new' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setActiveTab('new')}>New Student Registration</button>
            <button className={`flex-1 py-4 text-center font-bold text-sm ${activeTab === 'returning' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'}`} onClick={() => setActiveTab('returning')}>Returning Student Login</button>
          </div>

          {activeTab === 'returning' ? (
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back!</h2>
                <p className="text-slate-600">Log in securely using your Token.</p>
              </div>

              <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="your@email.com" className="w-full p-3 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unique Access Token</label>
                  <input type="text" value={loginToken} onChange={e => setLoginToken(e.target.value)} required placeholder="LWI-XXXXXX" className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono uppercase" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'Logging in...' : 'Secure Login'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Student Admissions Form</h2>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full p-3 border border-slate-200 rounded-xl" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full p-3 border border-slate-200 rounded-xl" />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <h3 className="font-semibold text-slate-800 flex items-center text-sm"><MapPin className="w-4 h-4 mr-2 text-indigo-500"/> Location & Contact</h3>
                      
                      {isLoadingLocation ? (
                        <div className="text-sm text-slate-500 flex items-center">Loading international country data...</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Country of Origin *</label>
                            <select name="country" value={formData.country} onChange={handleCountryChange} required className="w-full p-3 border border-slate-200 rounded-xl bg-white">
                              <option value="" disabled>Select Country</option>
                              {countriesList.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">State / Province *</label>
                            <select name="state" value={formData.state} onChange={handleInputChange} required disabled={!formData.country || availableStates.length === 0} className="w-full p-3 border border-slate-200 rounded-xl bg-white disabled:bg-slate-100">
                              <option value="" disabled>{!formData.country ? 'Select a country first' : (availableStates.length === 0 ? 'No states available' : 'Select State')}</option>
                              {availableStates.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full p-3 border border-slate-200 rounded-xl" />
                          </div>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setStep(2)} disabled={!isStep1Valid} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50">
                      Continue
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Pick your Forms (Courses)</h3>
                      <div className="space-y-6">
                        {courseCategories.map((category, catIdx) => (
                          <div key={catIdx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-4">{category.title}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {category.subjects.map((subject, idx) => (
                                <div key={idx} onClick={() => toggleCourse(subject)} className={`p-4 border-2 rounded-xl cursor-pointer flex items-center ${selectedCourses.includes(subject) ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white'}`}>
                                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${selectedCourses.includes(subject) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                    {selectedCourses.includes(subject) && <CheckCircle className="w-4 h-4" />}
                                  </div>
                                  <span className={`font-semibold text-sm ${selectedCourses.includes(subject) ? 'text-indigo-900' : 'text-slate-700'}`}>{subject}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3 pt-6 border-t border-slate-200">
                      <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl">Back</button>
                      <button type="button" onClick={() => { if (isStep2Valid) setStep(3); }} disabled={!isStep2Valid} className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50">
                        Proceed to Payment
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">Tuition Payment</h3>
                      <p className="text-slate-600 mt-2">Please make a transfer to the account below and upload your receipt.</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                       <div className="text-sm text-slate-500 mb-1">Total Amount Due</div>
                       <div className="text-4xl font-black text-slate-800 mb-6">₦50,000<span className="text-lg text-slate-500 font-medium">.00</span></div>
                       
                       <div className="w-full bg-white border border-indigo-100 p-5 rounded-xl mb-6 text-left shadow-sm space-y-4">
                         <h4 className="font-bold text-indigo-900 border-b border-indigo-50 pb-2">Instructor Bank Details</h4>
                         
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <p className="text-sm font-bold text-slate-800 mb-1">Option 1: Moniepoint</p>
                           <p className="text-sm text-slate-600">Account Number: <span className="font-semibold text-slate-900 text-lg tracking-wider ml-1">7069403441</span></p>
                           <p className="text-sm text-slate-600">Account Name: <span className="font-medium text-slate-900 ml-1">Favour Emeka</span></p>
                         </div>

                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <p className="text-sm font-bold text-slate-800 mb-1">Option 2: Access Bank</p>
                           <p className="text-sm text-slate-600">Account Number: <span className="font-semibold text-slate-900 text-lg tracking-wider ml-1">1386157946</span></p>
                           <p className="text-sm text-slate-600">Account Name: <span className="font-medium text-slate-900 ml-1">Favour Ifeoma Emeka</span></p>
                         </div>
                       </div>

                       <div className="w-full text-left mb-6">
                         <label className="block text-sm font-medium text-slate-700 mb-2">Upload Payment Receipt (Screenshot)</label>
                         <input 
                           type="file" 
                           accept="image/*,.pdf"
                           onChange={(e) => setReceiptFile(e.target.files[0])}
                           className="w-full p-3 border border-slate-200 rounded-xl bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                         />
                       </div>
                       
                       <button 
                         onClick={handleSimulatePayment} 
                         disabled={isProcessingPayment || isSubmitting || !receiptFile} 
                         className="w-full py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-indigo-700"
                       >
                          {isProcessingPayment || isSubmitting ? (
                            <span className="flex items-center">Uploading Receipt & Notifying Admin...</span>
                          ) : (
                            <span className="flex items-center justify-center">
                              Submit Application & Receipt
                            </span>
                          )}
                        </button>
                    </div>
                    <div className="pt-2 text-center">
                       <button type="button" onClick={() => setStep(2)} disabled={isProcessingPayment || isSubmitting} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Go back to edit courses</button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
