export type Language = 'en' | 'mr' | 'hi';

export interface Translations {
  [key: string]: {
    en: string;
    mr: string;
    hi: string;
  };
}

export const translations: Translations = {
  // General & App Titles
  appName: {
    en: 'EduNeev Kids Preschool',
    mr: 'एड्युनीव्ह किड्स प्रीस्कूल',
    hi: 'एड्युनीव किड्स प्लेस्कूल',
  },
  tagline: {
    en: 'A Foundation for the future... Since 2013',
    mr: 'भविष्याचा भक्कम पाया... २०१३ पासून',
    hi: 'भविष्य की मजबूत नींव... 2013 से',
  },
  adminDashboard: {
    en: 'Admin Dashboard',
    mr: 'ॲडमिन डॅशबोर्ड',
    hi: 'एडमिन डैशबोर्ड',
  },
  progressReports: {
    en: 'Progress & Milestones',
    mr: 'प्रगती व माइलस्टोन्स',
    hi: 'प्रगति और माइलस्टोन्स',
  },
  parentPortal: {
    en: 'Parent Portal',
    mr: 'पालक पोर्टल',
    hi: 'पेरेंट पोर्टल',
  },
  childProfile: {
    en: "Child's Profile",
    mr: 'पाल्याचे प्रोफाईल',
    hi: 'बच्चे का प्रोफाइल',
  },
  parentWelcome: {
    en: 'Welcome to your child’s daily learning & care portal',
    mr: 'तुमच्या पाल्याच्या दैनंदिन शिक्षण व काळजी पोर्टलवर स्वागत आहे',
    hi: 'अपने बच्चे के दैनिक शिक्षण और देखभाल पोर्टल में आपका स्वागत है',
  },
  presentToday: {
    en: 'Present Today',
    mr: 'आज उपस्थित',
    hi: 'आज उपस्थित',
  },
  absentToday: {
    en: 'Absent Today',
    mr: 'आज अनुपस्थित',
    hi: 'आज अनुपस्थित',
  },
  arrivalTime: {
    en: 'Checked in at 09:15 AM',
    mr: 'सकाळी ०९:१५ वाजता आगमन',
    hi: 'सुबह 09:15 बजे आगमन',
  },
  payFeesOnline: {
    en: 'Pay Fees Online',
    mr: 'ऑनलाईन फी भरा',
    hi: 'ऑनलाइन शुल्क भुगतान',
  },
  feeReceipt: {
    en: 'Download Receipt',
    mr: 'पावती डाउनलोड करा',
    hi: 'रसीद डाउनलोड करें',
  },
  activeAssignments: {
    en: 'Active Homework',
    mr: 'आजचा गृहपाठ',
    hi: 'आज का गृहकार्य',
  },
  dueTomorrow: {
    en: 'Due Tomorrow',
    mr: 'उद्या सादर करा',
    hi: 'कल तक जमा करें',
  },
  chatWithTeacher: {
    en: 'Chat with Class Teacher',
    mr: 'शिक्षकांशी चॅट करा',
    hi: 'शिक्षक से चैट करें',
  },
  todayMealMenu: {
    en: "Today's Meal & Food Menu",
    mr: 'आजचा आहार व जेवणाचा मेनू',
    hi: 'आज का भोजन और नाश्ता मेनू',
  },
  applyLeave: {
    en: 'Apply for Leave',
    mr: 'रजेचा अर्ज करा',
    hi: 'छुट्टी का आवेदन करें',
  },
  cctvLiveStream: {
    en: 'Classroom Live CCTV',
    mr: 'क्लासरूम थेट सीसीटीव्ही',
    hi: 'कक्षा लाइव सीसीटीवी',
  },
  cameraEnabledByAdmin: {
    en: 'Camera 01 • Enabled by Admin 🟢',
    mr: 'कॅमेरा ०१ • ॲडमिनने परवानगी दिलेली 🟢',
    hi: 'कैमरा 01 • एडमिन द्वारा चालू 🟢',
  },
  starStudent: {
    en: 'Star Student of the Week ⭐',
    mr: 'या आठवड्याचा स्टार विद्यार्थी ⭐',
    hi: 'इस सप्ताह का स्टार छात्र ⭐',
  },
  liveTimeline: {
    en: 'Daily Activity Timeline',
    mr: 'आजच्या दिवसभराच्या घडामोडी',
    hi: 'दैनिक गतिविधि समयरेखा',
  },

  // Greetings
  goodMorning: {
    en: 'Good Morning',
    mr: 'शुभ प्रभात',
    hi: 'सुप्रभात',
  },
  goodAfternoon: {
    en: 'Good Afternoon',
    mr: 'शुभ दुपार',
    hi: 'शुभ दोपहर',
  },
  goodEvening: {
    en: 'Good Evening',
    mr: 'शुभ संध्याकाळ',
    hi: 'शुभ संध्या',
  },

  // Hero Section
  heroSubtitle: {
    en: 'Here is your preschool network performance, live attendance metrics, and financial status for',
    mr: 'येथे आपल्या प्रीस्कूलची कामगिरी, हजेरी आणि आर्थिक स्थितीचे थेट अपडेट्स पहा -',
    hi: 'यहाँ अपने प्लेस्कूल के प्रदर्शन, उपस्थिति और वित्तीय स्थिति का सीधा अपडेट देखें -',
  },
  newAdmission: {
    en: 'New Admission',
    mr: 'नवीन प्रवेश',
    hi: 'नया दाखिला',
  },
  branch: {
    en: 'BRANCH',
    mr: 'शाखा',
    hi: 'शाखा',
  },
  allBranches: {
    en: 'All Franchise Branches',
    mr: 'सर्व फ्रँचायझी शाखा',
    hi: 'सभी फ्रेंचाइजी शाखाएं',
  },

  // KPI Stat Cards
  totalActiveStudents: {
    en: 'Total Active Students',
    mr: 'एकूण सक्रिय विद्यार्थी',
    hi: 'कुल सक्रिय छात्र',
  },
  totalStaffTeachers: {
    en: 'Total Staff & Teachers',
    mr: 'एकूण शिक्षक व कर्मचारी',
    hi: 'कुल शिक्षक और कर्मचारी',
  },
  todayAttendance: {
    en: "Today's Attendance",
    mr: 'आजची हजेरी',
    hi: 'आज की उपस्थिति',
  },
  pendingFees: {
    en: 'Pending Fees',
    mr: 'बाकी फी',
    hi: 'बकाया शुल्क',
  },
  thisMonthGrowth: {
    en: '+12% this month',
    mr: '+१२% या महिन्यात वाढ',
    hi: '+12% इस महीने वृद्धि',
  },
  fullyStaffed: {
    en: 'Fully Staffed',
    mr: 'पूर्ण कर्मचारी',
    hi: 'पूर्ण कर्मचारी',
  },
  activeSession: {
    en: 'Active Session',
    mr: 'सुरू सत्र',
    hi: 'सक्रिय सत्र',
  },
  actionNeeded: {
    en: 'Action Needed',
    mr: 'कारवाई आवश्यक',
    hi: 'कार्रवाई आवश्यक',
  },

  // Analytics & Charts
  enquiriesVsAdmissions: {
    en: 'Enquiries vs Admissions',
    mr: 'चौकशी विरूद्ध प्रवेश',
    hi: 'पूछताछ बनाम दाखिले',
  },
  monthlyTrend: {
    en: 'Monthly Conversion Trajectory',
    mr: 'मासिक प्रवेश आलेख',
    hi: 'मासिक परिवर्तन रुझान',
  },
  liveMonthlyTrend: {
    en: 'Live Monthly Trend',
    mr: 'मासिक अपडेट्स',
    hi: 'मासिक अपडेट',
  },
  enquiries: {
    en: 'Enquiries',
    mr: 'चौकशी (Enquiries)',
    hi: 'पूछताछ (Enquiries)',
  },
  admissions: {
    en: 'Admissions',
    mr: 'प्रवेश (Admissions)',
    hi: 'दाखिले (Admissions)',
  },
  feesCollectionTrend: {
    en: 'Fees Collection Trend',
    mr: 'फी जमा व बाकी आलेख',
    hi: 'शुल्क संग्रह और बकाया रुझान',
  },
  collectedVsPending: {
    en: 'Collected vs Outstanding Revenue',
    mr: 'जमा फी विरूद्ध बाकी फी',
    hi: 'जमा बनाम बकाया शुल्क',
  },
  financialOverview: {
    en: 'Financial Overview',
    mr: 'आर्थिक आढावा',
    hi: 'वित्तीय अवलोकन',
  },
  collected: {
    en: 'Collected',
    mr: 'जमा रक्कम',
    hi: 'जमा राशि',
  },
  pending: {
    en: 'Pending',
    mr: 'बाकी रक्कम',
    hi: 'बकाया राशि',
  },

  // Franchise Network
  franchiseNetworkControl: {
    en: 'FRANCHISE NETWORK CONTROL',
    mr: 'फ्रँचायझी नेटवर्क नियंत्रण',
    hi: 'फ्रेंचाइजी नेटवर्क नियंत्रण',
  },
  franchiseOverviewTitle: {
    en: 'Franchise Branches — Students, Staff & Supply Kits',
    mr: 'फ्रँचायझी शाखा — विद्यार्थी, शिक्षक आणि गणवेश किट्स',
    hi: 'फ्रेंचाइजी शाखाएं — छात्र, शिक्षक और ड्रेस किट',
  },
  manageSuppliesKits: {
    en: 'Manage Branch Supplies & Kits',
    mr: 'साहित्य व किट्स व्यवस्थापन',
    hi: 'सामग्री और किट प्रबंधन',
  },
  studentsCount: {
    en: 'STUDENTS',
    mr: 'विद्यार्थी',
    hi: 'छात्र',
  },
  staffCount: {
    en: 'STAFF',
    mr: 'कर्मचारी',
    hi: 'कर्मचारी',
  },
  uniformsRequired: {
    en: 'UNIFORMS',
    mr: 'गणवेश',
    hi: 'ड्रेस',
  },

  // Module Hub & Tabs
  preschoolOpsTitle: {
    en: 'Preschool Operations & Module Navigation',
    mr: 'प्रीस्कूल व्यवस्थापन व मॉड्यूल नेव्हिगेशन',
    hi: 'प्लेस्कूल संचालन और मॉड्यूल नेविगेशन',
  },
  preschoolOpsSubtitle: {
    en: 'Quickly access management tools, student records, and school media portal',
    mr: 'व्यवस्थापन साधने, विद्यार्थी नोंदी आणि मीडिया पोर्टलवर जलद जा',
    hi: 'प्रबंधन उपकरण, छात्र रिकॉर्ड और मीडिया पोर्टल तक त्वरित पहुंच',
  },
  searchPlaceholder: {
    en: 'Search feature module...',
    mr: 'मॉड्यूल शोधा...',
    hi: 'मॉड्यूल खोजें...',
  },
  allModules: {
    en: 'All Modules',
    mr: 'सर्व मॉड्यूल्स',
    hi: 'सभी मॉड्यूल',
  },
  tabAcademic: {
    en: 'Academic & Students',
    mr: '📚 शैक्षणिक व विद्यार्थी',
    hi: '📚 शैक्षणिक और छात्र',
  },
  tabDaycare: {
    en: 'Daycare & Leads',
    mr: '👶 डेकेअर व चौकशी',
    hi: '👶 डेकेयर और पूछताछ',
  },
  tabFinance: {
    en: 'Finance & Operations',
    mr: '💳 वित्त व ऑपरेशन्स',
    hi: '💳 वित्त और संचालन',
  },
  tabCommunication: {
    en: 'Communication & Media',
    mr: '📢 संवाद व मीडिया',
    hi: '📢 संचार और मीडिया',
  },

  // Sidebar & Modules Lists
  dashboard: {
    en: 'Dashboard',
    mr: 'Dashboard',
    hi: 'डैशबोर्ड',
  },
  studentsDirectory: {
    en: 'Students Directory',
    mr: 'Students Directory',
    hi: 'छात्र निर्देशिका',
  },
  staffDirectory: {
    en: 'Staff Directory',
    mr: 'Staff Directory',
    hi: 'कर्मचारी निर्देशिका',
  },
  classesManagement: {
    en: 'Classes Management',
    mr: 'Classes Management',
    hi: 'कक्षा प्रबंधन',
  },
  homework: {
    en: 'Homework Assignments',
    mr: 'Homework Assignments',
    hi: 'गृहकार्य (होमवर्क)',
  },
  timetable: {
    en: 'Class Timetable',
    mr: 'Class Timetable',
    hi: 'समय सारणी (टाइमटेबल)',
  },
  certificates: {
    en: 'Certificates & Awards',
    mr: 'Certificates & Awards',
    hi: 'प्रमाण पत्र और पुरस्कार',
  },
  studentNotes: {
    en: 'Student Notes & Logs',
    mr: 'Student Notes & Logs',
    hi: 'छात्र नोट्स',
  },
  healthRecords: {
    en: 'Health & Medical',
    mr: 'Health & Medical',
    hi: 'स्वास्थ्य रिकॉर्ड',
  },
  childProgressReport: {
    en: 'Child Progress Report',
    mr: 'पाल्याचा प्रगती अहवाल',
    hi: 'बच्चे का प्रगति रिपोर्ट कार्ड',
  },
  daycareManagement: {
    en: 'Daycare Management',
    mr: 'Daycare Management',
    hi: 'डेकेयर प्रबंधन',
  },
  daycareTracker: {
    en: 'Daycare Care Tracker',
    mr: '👶 डेकेअर केअर ट्रॅकर',
    hi: '👶 डेकेयर केयर ट्रैकर',
  },
  foodMenuManagement: {
    en: 'Food & Meal Menu',
    mr: '🍲 आहार व जेवण मेनू',
    hi: '🍲 आहार व भोजन मेनू',
  },
  admissionEnquiries: {
    en: 'Admission Enquiries',
    mr: 'Admission Enquiries',
    hi: 'दाखिला पूछताछ',
  },
  schoolCalendar: {
    en: 'School Calendar',
    mr: 'School Calendar',
    hi: 'स्कूल कैलेंडर',
  },
  feesPayments: {
    en: 'Fees & Payment Gateways',
    mr: 'Fees & Payments',
    hi: 'शुल्क और भुगतान',
  },
  feeStructures: {
    en: 'Class Fee Structures',
    mr: 'वर्गनिहाय फी रचना',
    hi: 'कक्षावार फीस संरचना',
  },
  expensesManagement: {
    en: 'Expenses & Receipts',
    mr: 'Expenses & Receipts',
    hi: 'खर्च प्रबंधन',
  },
  hrPayroll: {
    en: 'HR & Staff Payroll',
    mr: 'HR & Staff Payroll',
    hi: 'एचआर और वेतन',
  },
  transportRoutes: {
    en: 'Transport Routes & Bus',
    mr: 'Transport Routes & Bus',
    hi: 'परिवहन और बस मार्ग',
  },
  inventoryStock: {
    en: 'Inventory & Stock Supplies',
    mr: 'Inventory & Supplies',
    hi: 'सामग्री और स्टॉक',
  },
  franchiseNetwork: {
    en: 'Franchise, Royalty & Kits',
    mr: 'Franchise, Royalty & Kits',
    hi: 'फ्रेंचाइजी, रॉयल्टी और किट्स',
  },
  digitalAttendance: {
    en: 'Digital Attendance',
    mr: 'Digital Attendance',
    hi: 'डिजिटल उपस्थिति',
  },
  storyFeed: {
    en: 'Story Feed & Moments',
    mr: 'Story Feed & Moments',
    hi: 'स्टोरी फीड और फोटो',
  },
  notices: {
    en: 'School Notices',
    mr: 'School Notices',
    hi: 'स्कूल सूचनाएं',
  },
  chatPortal: {
    en: 'Parent Chat Portal',
    mr: 'Parent Chat Portal',
    hi: 'अभिभावक चैट पोर्टल',
  },
  schoolGallery: {
    en: 'School Photo Gallery',
    mr: 'School Photo Gallery',
    hi: 'फोटो गैलरी',
  },
  leaveApprovals: {
    en: 'Staff Leave Approvals',
    mr: 'Staff Leave Approvals',
    hi: 'छुट्टी आवेदन',
  },
  studentLeave: {
    en: 'Student Leave Applications',
    mr: 'Student Leave Applications',
    hi: 'छात्र अवकाश आवेदन',
  },
  cctvAccess: {
    en: 'Live CCTV Cameras',
    mr: 'Live CCTV Cameras',
    hi: 'लाइव सीसीटीवी',
  },
  ptmScheduler: {
    en: 'PTM Scheduler',
    mr: 'पालक-शिक्षक बैठक',
    hi: 'अभिभावक-शिक्षक बैठक',
  },
  libraryBooks: {
    en: 'Library & Books',
    mr: 'ग्रंथालय आणि पुस्तके',
    hi: 'पुस्तकालय और पुस्तकें',
  },

  aboutUs: {
    en: 'About Us',
    mr: 'About Us',
    hi: 'हमारे बारे में',
  },

  // Audit Log / Recent Activities
  recentSystemActivities: {
    en: 'Recent System Activities',
    mr: 'अलीकडील सिस्टीम हालचाली',
    hi: 'हाल की सिस्टम गतिविधियां',
  },
  realTimeAuditLog: {
    en: 'Real-time Audit Log',
    mr: 'थेट ऑडीट लॉग',
    hi: 'रीयल-टाइम ऑडिट लॉग',
  },
  noRecentActivity: {
    en: 'No recent activity recorded.',
    mr: 'कोणतीही नवीन हालचाल नोंदवलेली नाही.',
    hi: 'कोई हाल की गतिविधि दर्ज नहीं की गई।',
  },

  // Login Page Translations
  loginTitle: {
    en: 'Sign In to Dashboard',
    mr: 'डॅशबोर्डवर लॉगिन करा',
    hi: 'डैशबोर्ड में साइन इन करें',
  },
  loginSubtitle: {
    en: 'Management & Executive Administration Panel',
    mr: 'प्रशासन व व्यवस्थापन पोर्टल',
    hi: 'प्रबंधन और प्रशासनिक पोर्टल',
  },
  emailLabel: {
    en: 'Email Address',
    mr: 'ईमेल आयडी',
    hi: 'ईमेल पता',
  },
  passwordLabel: {
    en: 'Password',
    mr: 'पासवर्ड',
    hi: 'पासवर्ड',
  },
  signInButton: {
    en: 'Sign In to Dashboard',
    mr: 'लॉगिन करा',
    hi: 'साइन इन करें',
  },
  signingIn: {
    en: 'Signing in...',
    mr: 'लॉगिन होत आहे...',
    hi: 'साइन इन हो रहा है...',
  },
  securityEncryption: {
    en: '256-Bit SSL Encrypted & Secure Authentication',
    mr: '२५६-बिट एसएसएल सुरक्षित ऑथेंटिकेशन',
    hi: '256-बिट एसएसएल सुरक्षित प्रमाणीकरण',
  },

  // Common Controls
  logout: {
    en: 'Logout',
    mr: 'लॉगआउट',
    hi: 'लॉगआउट',
  },
  clearFilter: {
    en: 'Clear Filter',
    mr: 'फिल्टर काढा',
    hi: 'फ़िल्टर हटाएं',
  },
  selectLanguage: {
    en: 'Language',
    mr: 'भाषा',
    hi: 'भाषा',
  }
};
