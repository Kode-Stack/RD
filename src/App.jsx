import React, { useState, useEffect, useRef } from 'react';
import { Mail, Sparkles, X, Edit2, Check, Trash2, List, Trophy, Smile, HeartPulse, ShoppingBag, ExternalLink } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';

// --- TU CONFIGURACIÓN REAL DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBJQ9PJHhNU1U2x4ljBMHzCUUlom6cmpGo",
  authDomain: "regalodanae1.firebaseapp.com",
  projectId: "regalodanae1",
  storageBucket: "regalodanae1.firebasestorage.app",
  messagingSenderId: "952131161008",
  appId: "1:952131161008:web:f9c61735d5a559bfe1e475",
  measurementId: "G-YHLJMW9XLT"
};

// --- INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "regalo-danae-final"; // ID fijo para tus rutas de base de datos
const FIREBASE_WRITE_TIMEOUT_MS = 12000;
const SAVE_UI_MAX_WAIT_MS = 2500;
const DANAE_AVATAR_URL = "https://i.pinimg.com/736x/6f/0e/9c/6f0e9c0bbef556cfd0d76a75f3819289.jpg";

// --- CONFIGURACIÓN DE USUARIOS ---
const AUTH_CONFIG = {
  "lili": { 
    name: "Amaro", 
    role: "novio", 
    color: "blue",
    avatar: "https://i.pinimg.com/736x/a5/78/d9/a578d9499607489c0124cc5fba613c23.jpg" 
  },
  "carlota": { 
    name: "Danae", 
    role: "novia", 
    color: "pink",
    avatar: DANAE_AVATAR_URL
  }
};

const FECHA_INICIO = new Date('2025-10-08T00:00:00'); 

const MOODS = [
  { img: "https://images.squarespace-cdn.com/content/v1/6670add926f2a64cd00fb0e7/d2f9b9c1-ab9c-4fe2-a793-d6a8634ac920/character+chii.png", label: "Feliz" },
  { img: "https://i.pinimg.com/236x/4b/17/5a/4b175a5bc508d7dc68bab040d484670a.jpg", label: "Cansado/a" },
  { img: "https://i.pinimg.com/originals/cd/26/75/cd2675a86bb1c533aeab907deb8a06e4.jpg", label: "Con hambre" },
  { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbKy7s2h7aLL8HTZ6G4cZTdUJM27ehqajRlw&s", label: "Enamorado/a" },
  { img: "https://i.pinimg.com/736x/85/ad/20/85ad2095edcfc389c46daca8216e5e03.jpg", label: "Triste" },
  { img: "https://images.squarespace-cdn.com/content/v1/6670add926f2a64cd00fb0e7/ffffd5a7-51a4-466c-9e79-195421ed4f64/character+3.png", label: "¡Aaaah!" }
];

const DAILY_CHALLENGES = [
  "Envíale un audio de 30 segundos diciendo por qué le amas.",
  "Busca una foto vieja de ambos y compártela.",
  "Planea una cita sorpresa para el próximo mes.",
  "Dile un cumplido que nunca antes le hayas dicho.",
  "Envíale su canción favorita 'porque sí'."
];

const CARDS = [
  { title: "Estés triste", content: "Recuerda que siempre estaré aquí para abrazarte princesa. Eres fuerte y esto pasará.", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { title: "Me extrañes", content: "Cierra los ojos y recuerda nuestro último abrazo, recuerda el calor de mi piel con el tuyo.", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { title: "Estés aburrida", content: "Porque si estás aburrida no me hablas tonta.", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { title: "Dudes de ti", content: "Eres inteligente y capaz de todo. No dejes que nadie te diga lo contrario cabeza de chorlito.", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { title: "Tengas un logro", content: "Eres súper de genia, te amo mucho princesa de melón.", color: "bg-green-100 text-green-800 border-green-200" },
  { title: "Quieras un beso", content: "Hacémelo valer por mil besos la próxima vez que nos veamos", color: "bg-red-100 text-red-800 border-red-200" }
];

const DEFAULT_SHARED_STATE = {
  note: "Un espacio solo para nosotros.",
  plans: [],
  wishlist: [],
  moods: {
    Amaro: { img: "https://i.pinimg.com/736x/a5/78/d9/a578d9499607489c0124cc5fba613c23.jpg", label: "Disponible" },
    Danae: { img: DANAE_AVATAR_URL, label: "Disponible" },
  },
};

const normalizeMoods = (remoteMoods = {}) => {
  const merged = {
    ...DEFAULT_SHARED_STATE.moods,
    ...remoteMoods,
  };

  const danaeMood = merged?.Danae || {};
  const hasBrokenDanaeImg = typeof danaeMood.img === 'string' && danaeMood.img.includes('static.wikia.nocookie.net/chiikawa/images/4/43/YahaUsagi.png');

  return {
    ...merged,
    Danae: {
      ...DEFAULT_SHARED_STATE.moods.Danae,
      ...danaeMood,
      img: hasBrokenDanaeImg ? DANAE_AVATAR_URL : (danaeMood.img || DANAE_AVATAR_URL),
    },
  };
};

const withTimeout = (promise, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject({ code: 'timeout' }), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
};

const getFirebaseErrorMessage = (err, scope = 'sync') => {
  const code = err?.code || '';
  const currentHost = typeof window !== 'undefined' ? window.location.host : 'desconocido';

  const withCode = (message) => `${message}${code ? ` (código: ${code})` : ''}`;

  if (code === 'auth/operation-not-allowed') {
    return withCode('Firebase no permite login anónimo. Activa Anonymous en Authentication > Sign-in method.');
  }
  if (code === 'auth/admin-restricted-operation') {
    return withCode('Firebase bloqueó el login anónimo. Activa Anonymous en Authentication > Sign-in method.');
  }
  if (code === 'auth/unauthorized-domain') {
    return withCode(`Dominio no autorizado en Firebase Auth. Agrega este dominio en Authentication > Settings > Authorized domains. Dominio actual: ${currentHost}.`);
  }
  if (code === 'auth/app-not-authorized') {
    return withCode(`La app/dominio no está autorizada para esta API key. Revisa API key y Authorized domains. Dominio actual: ${currentHost}.`);
  }
  if (code === 'auth/invalid-api-key') {
    return withCode('API key inválida para Firebase Auth. Revisa apiKey en la configuración del proyecto.');
  }
  if (code === 'auth/configuration-not-found') {
    return withCode('Configuración de Authentication no encontrada. Revisa que el proyecto Firebase esté bien configurado.');
  }
  if (code === 'auth/network-request-failed') {
    return withCode('Falló la conexión de red con Firebase. Revisa internet o bloqueo de extensiones.');
  }
  if (code === 'permission-denied') {
    return withCode('Firebase rechazó lectura/escritura. Revisa reglas de Firestore.');
  }
  if (code === 'unavailable') {
    return withCode('Firestore no está disponible temporalmente. Intenta nuevamente en unos segundos.');
  }
  if (code === 'timeout') {
    return withCode('Firebase tardó demasiado en responder. Revisa la red o vuelve a intentar.');
  }

  if (scope === 'auth') {
    return withCode(`No se pudo autenticar con Firebase. Revisa Authentication y dominio autorizado. Dominio actual: ${currentHost}.`);
  }
  if (scope === 'write') {
    return withCode('No se pudieron guardar los cambios en Firebase.');
  }

  return withCode('No se pudo sincronizar con Firebase.');
};

export default function App() {
  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 });
  const [activeCard, setActiveCard] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [challenge, setChallenge] = useState(DAILY_CHALLENGES[0]);

  const [sharedState, setSharedState] = useState(DEFAULT_SHARED_STATE);
  const [dbError, setDbError] = useState('');
  const [isDbReady, setIsDbReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const authRequestRef = useRef(null);
  
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [newPlanText, setNewPlanText] = useState("");
  const [newWishTitle, setNewWishTitle] = useState("");
  const [newWishUrl, setNewWishUrl] = useState("");

  useEffect(() => {
    if (dbError) {
      console.warn('[Firebase]', dbError);
    }
  }, [dbError]);

  const signInAnonymouslyOnce = async () => {
    if (auth.currentUser) return auth.currentUser;
    if (authRequestRef.current) return authRequestRef.current;

    authRequestRef.current = signInAnonymously(auth)
      .then((credentials) => {
        setUser(credentials.user);
        setDbError('');
        return credentials.user;
      })
      .catch((err) => {
        console.error('Auth failed:', err);
        setDbError(getFirebaseErrorMessage(err, 'auth'));
        return null;
      })
      .finally(() => {
        authRequestRef.current = null;
      });

    return authRequestRef.current;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        setDbError('');
      }
    });

    void signInAnonymouslyOnce();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'plans', 'sharedState');

    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      try {
        if (snapshot.exists()) {
          const remote = snapshot.data() || {};
          setSharedState({
            ...DEFAULT_SHARED_STATE,
            ...remote,
            plans: Array.isArray(remote.plans) ? remote.plans : [],
            wishlist: Array.isArray(remote.wishlist) ? remote.wishlist : [],
            moods: normalizeMoods(remote.moods || {}),
          });
        } else {
          await withTimeout(setDoc(docRef, DEFAULT_SHARED_STATE, { merge: true }), FIREBASE_WRITE_TIMEOUT_MS);
        }
        setDbError('');
        setIsDbReady(true);
      } catch (err) {
        console.error("Firestore snapshot handling error:", err);
        setDbError(getFirebaseErrorMessage(err, 'sync'));
        setIsDbReady(false);
      }
    }, (err) => {
      console.error("Firestore sync error:", err);
      setDbError(getFirebaseErrorMessage(err, 'sync'));
      setIsDbReady(false);
    });

    return () => unsubscribe();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      const now = new Date();
      const difference = now.getTime() - FECHA_INICIO.getTime();
      const absDiff = Math.abs(difference);
      const totalSeconds = Math.floor(absDiff / 1000);
      const totalDays = Math.floor(totalSeconds / 86400);
      setTimeLeft({
        years: Math.floor(totalDays / 365),
        months: Math.floor((totalDays % 365) / 30),
        days: (totalDays % 365) % 30,
        hours: Math.floor((totalSeconds / 3600) % 24),
        minutes: Math.floor((totalSeconds / 60) % 60),
        seconds: totalSeconds % 60,
        totalDays
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const ensureFirebaseSession = async () => {
    if (user) return user;
    if (auth.currentUser) {
      setUser(auth.currentUser);
      return auth.currentUser;
    }

    if (!authRequestRef.current) {
      setDbError('Conectando con Firebase...');
    }

    return signInAnonymouslyOnce();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (isLoggingIn) return;

    const passLower = password.toLowerCase();

    if (!AUTH_CONFIG[passLower]) {
      setError('Esa no es la clave secreta...');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsLoggingIn(true);
    setError('');

    setSessionInfo(AUTH_CONFIG[passLower]);
    setChallenge(DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)]);
    setIsAuthenticated(true);
    setDbError('');
    setIsDbReady(false);

    void ensureFirebaseSession().finally(() => {
      setIsLoggingIn(false);
    });
  };

  const updateSharedState = async (updates) => {
    const activeUser = user || auth.currentUser || await ensureFirebaseSession();
    if (!activeUser) {
      return false;
    }

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'plans', 'sharedState');
    setIsSaving(true);

    let finished = false;
    const hideSavingTimer = setTimeout(() => {
      if (!finished) setIsSaving(false);
    }, SAVE_UI_MAX_WAIT_MS);

    try {
      setDoc(docRef, updates, { merge: true })
        .then(() => {
          setDbError('');
        })
        .catch((err) => {
          console.error("Firestore write error:", err);
          setDbError(getFirebaseErrorMessage(err, 'write'));
        })
        .finally(() => {
          finished = true;
          clearTimeout(hideSavingTimer);
          setIsSaving(false);
        });

      return true;
    } catch (err) {
      finished = true;
      clearTimeout(hideSavingTimer);
      setIsSaving(false);
      console.error("Firestore write bootstrap error:", err);
      setDbError(getFirebaseErrorMessage(err, 'write'));
      return false;
    }
  };

  const addPlan = async (e) => {
    e.preventDefault();
    if (!newPlanText.trim()) return;
    const plan = { id: Date.now().toString(), text: newPlanText.trim(), createdBy: sessionInfo.name, completed: false, dateCompleted: null };
    const ok = await updateSharedState({ plans: arrayUnion(plan) });
    if (ok) setNewPlanText("");
  };

  const addWishItem = async (e) => {
    e.preventDefault();
    if (!newWishTitle.trim()) return;
    const wish = { 
      id: Date.now().toString(), 
      title: newWishTitle.trim(), 
      url: newWishUrl.trim() ? (newWishUrl.trim().startsWith('http') ? newWishUrl.trim() : `https://${newWishUrl.trim()}`) : "",
      addedBy: sessionInfo.name 
    };
    const ok = await updateSharedState({ wishlist: arrayUnion(wish) });
    if (ok) {
      setNewWishTitle("");
      setNewWishUrl("");
    }
  };

  const togglePlan = async (p) => {
    const updatedPlans = (sharedState.plans || []).map(item => 
      item.id === p.id ? { ...item, completed: !item.completed, dateCompleted: !item.completed ? new Date().toISOString() : null } : item
    );
    await updateSharedState({ plans: updatedPlans });
  };

  const removePlan = async (p) => {
    const updatedPlans = (sharedState.plans || []).filter((item) => item.id !== p.id);
    await updateSharedState({ plans: updatedPlans });
  };

  const removeWishItem = async (w) => {
    const updatedWishlist = (sharedState.wishlist || []).filter((item) => item.id !== w.id);
    await updateSharedState({ wishlist: updatedWishlist });
  };

  const updateMood = async (mood) => {
    const newMoods = {
      ...DEFAULT_SHARED_STATE.moods,
      ...(sharedState.moods || {}),
      [sessionInfo.name]: mood,
    };
    await updateSharedState({ moods: newMoods });
  };

  const saveNote = async () => {
    const ok = await updateSharedState({ note: tempNote });
    if (ok) setIsEditingNote(false);
  };

  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-3 sm:p-4 overflow-hidden relative bg-cover bg-center"
        style={{ backgroundImage: `url('https://i.pinimg.com/736x/f9/b4/7f/f9b47fbafa262dfa2bac6508f4005970.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-12 text-center border border-white/50 z-10 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl overflow-hidden border-4 border-rose-400 bg-white">
             <img src="https://i.pinimg.com/736x/5b/bd/10/5bbd104fa11076bb0947ab819360526d.jpg" alt="Login Chiikawa" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 font-serif text-rose-500">Amaro & Danae</h1>
          <p className="text-gray-500 mb-6 sm:mb-8 font-medium">Ingresa tu clave secreta</p>
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <input
              type="password"
              disabled={isLoggingIn}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-rose-100 focus:border-rose-400 outline-none text-center transition-all bg-white/50 text-base sm:text-lg disabled:opacity-60"
            />
            <button disabled={isLoggingIn} type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg transition-transform active:scale-95 text-base sm:text-lg disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoggingIn ? 'Conectando...' : 'Acceder al Mundo Chiikawa'}
            </button>
          </form>
          {error && <p className="mt-4 text-rose-500 font-bold animate-bounce">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 text-gray-800 font-sans pb-16 sm:pb-20 selection:bg-rose-200">
      {/* HEADER DINÁMICO */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-40 border-b border-rose-100 px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-lg shadow-rose-200 overflow-hidden border-2 border-white bg-white">
              <img src={sessionInfo.avatar} alt={sessionInfo.name} className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase text-rose-300 tracking-[0.15em] sm:tracking-[0.2em] leading-none mb-1">Nuestro Espacio</p>
              <h2 className="font-black text-gray-800 text-base sm:text-lg">Hola, {sessionInfo.name} ✨</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden md:flex items-center gap-4 bg-rose-50/50 p-2 rounded-2xl border border-rose-100">
              {Object.entries(sharedState.moods || {}).map(([name, mood]) => (
                <div key={name} className="flex items-center gap-3 px-2 border-r last:border-0 border-rose-100">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm bg-white">
                    <img src={mood.img} alt={mood.label} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{name}</span>
                    <span className="text-[10px] font-bold text-gray-600 truncate max-w-[80px]">{mood.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="bg-gray-100 hover:bg-rose-100 p-2 sm:p-2.5 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-2 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {Object.entries(sharedState.moods || {}).map(([name, mood]) => (
              <div key={`mobile-${name}`} className="min-w-[130px] flex items-center gap-2 bg-rose-50/70 border border-rose-100 rounded-xl px-2 py-1.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm bg-white">
                  <img src={mood.img} alt={mood.label} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-tight text-gray-400">{name}</p>
                  <p className="text-[11px] font-bold text-gray-700 truncate">{mood.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-8 space-y-6 sm:space-y-10">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-rose-100 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Smile className="w-4 h-4" /> ¿Cómo estás hoy?</h3>
            <div className="grid grid-cols-3 gap-3">
              {MOODS.map((m) => (
                <button 
                  key={m.label} 
                  onClick={() => updateMood(m)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-110 bg-white ${sharedState.moods[sessionInfo.name]?.label === m.label ? 'border-rose-400 shadow-md shadow-rose-100' : 'border-transparent bg-rose-50/10'}`}
                >
                  <img src={m.img} alt={m.label} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-amber-100 flex flex-col justify-center relative group">
            <Sparkles className="absolute -right-2 -bottom-2 w-20 h-20 text-amber-200 opacity-30" />
            <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2"><Trophy className="w-4 h-4" /> Misión de hoy</h3>
            <p className="text-amber-800 font-bold italic leading-tight text-base sm:text-lg">"{challenge}"</p>
          </div>
          <div className="bg-rose-500 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center relative">
             <h3 className="text-xs font-bold text-rose-200 uppercase tracking-widest mb-2">Dato Curioso</h3>
             <div className="flex items-center gap-3">
                <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 text-rose-200 animate-pulse" />
                <div>
                   <p className="text-xl sm:text-2xl font-black">{((timeLeft.totalDays || 0) * 100000).toLocaleString()}+</p>
                   <p className="text-[10px] font-bold uppercase opacity-80">Latidos juntos aprox.</p>
                </div>
             </div>
          </div>
        </div>

        <section className="bg-white rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-12 shadow-sm border border-rose-100 text-center relative">
          <h2 className="text-sm sm:text-xl font-black text-gray-400 mb-6 sm:mb-10 uppercase tracking-[0.18em] sm:tracking-[0.3em]">Nuestra Historia Juntos</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-4">
            <TimeUnit label="Años" value={timeLeft.years} />
            <TimeUnit label="Meses" value={timeLeft.months} />
            <TimeUnit label="Días" value={timeLeft.days} />
            <TimeUnit label="Horas" value={timeLeft.hours} />
            <TimeUnit label="Mins" value={timeLeft.minutes} />
            <TimeUnit label="Segs" value={timeLeft.seconds} />
          </div>
          <p className="mt-8 text-xs font-bold text-gray-400 uppercase tracking-widest">Desde el 08 de Octubre de 2025</p>
        </section>

        <div className="grid lg:grid-cols-5 gap-4 sm:gap-8">
          <section className="lg:col-span-3 bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-rose-100 flex flex-col min-h-0 lg:min-h-[500px]">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2 sm:gap-3">
                <List className="w-6 h-6 text-indigo-500" /> Aventuras
              </h2>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                 <button onClick={() => setActiveTab('pending')} className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold ${activeTab === 'pending' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Pendientes</button>
                 <button onClick={() => setActiveTab('completed')} className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold ${activeTab === 'completed' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Logrados</button>
              </div>
            </div>
            {activeTab === 'pending' && (
              <form onSubmit={addPlan} className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8 bg-rose-50/30 p-2 sm:p-1.5 rounded-2xl border border-rose-100">
                <input type="text" value={newPlanText} onChange={(e) => setNewPlanText(e.target.value)} placeholder="Propón un plan..." className="flex-1 bg-transparent px-4 py-2.5 outline-none" />
                <button type="submit" className="bg-rose-500 text-white px-6 py-2.5 sm:py-0 rounded-xl font-bold w-full sm:w-auto">Añadir</button>
              </form>
            )}
            <div className="space-y-3 sm:space-y-4 overflow-y-auto max-h-[360px] sm:max-h-[400px] pr-1 sm:pr-2 custom-scrollbar">
              {sharedState.plans?.filter(p => activeTab === 'pending' ? !p.completed : p.completed).map((p) => (
                <div key={p.id} className="group flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 hover:border-rose-200 transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <button onClick={() => togglePlan(p)} className={`w-6 h-6 rounded-full border-2 ${p.completed ? 'bg-green-500 border-green-500' : 'border-gray-200'}`}>
                      {p.completed && <Check className="w-4 h-4 text-white mx-auto" />}
                    </button>
                    <div>
                      <p className={`font-bold text-sm sm:text-base ${p.completed ? 'line-through text-gray-400' : ''}`}>{p.text}</p>
                      <p className="text-[9px] font-black uppercase text-gray-400">De {p.createdBy}</p>
                    </div>
                  </div>
                  <button onClick={() => removePlan(p)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-300 hover:text-rose-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-2 bg-gradient-to-br from-rose-400 to-pink-500 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-2xl text-white flex flex-col justify-between relative group overflow-hidden min-h-0 lg:min-h-[500px]">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-black italic">Pizarrón ✨</h2>
                <button onClick={() => { setIsEditingNote(true); setTempNote(sharedState.note); }} className="bg-white/20 p-2 rounded-xl"><Edit2 className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {isEditingNote ? (
                  <div className="w-full space-y-4">
                    <textarea value={tempNote} onChange={(e) => setTempNote(e.target.value)} className="w-full bg-white/20 rounded-2xl p-4 text-white outline-none" rows="8" />
                    <div className="flex gap-2">
                      <button onClick={saveNote} className="bg-white text-rose-500 px-6 py-2 rounded-xl font-bold">Guardar</button>
                      <button onClick={() => setIsEditingNote(false)} className="text-white/80">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p className="italic text-lg sm:text-2xl font-serif text-center leading-relaxed">"{sharedState.note}"</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* WISHLIST */}
        <section className="bg-white rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-8 shadow-sm border border-rose-100">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-3"><ShoppingBag className="w-6 h-6 text-rose-500" /> Lista de Deseos</h2>
              <form onSubmit={addWishItem} className="w-full md:flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 bg-rose-50/30 p-2 rounded-2xl sm:rounded-3xl border border-rose-100">
                <input type="text" value={newWishTitle} onChange={(e) => setNewWishTitle(e.target.value)} placeholder="¿Qué quieres?" className="w-full sm:flex-1 bg-white px-4 py-2.5 rounded-2xl text-sm" />
                <input type="text" value={newWishUrl} onChange={(e) => setNewWishUrl(e.target.value)} placeholder="URL opcional" className="w-full sm:flex-1 bg-white px-4 py-2.5 rounded-2xl text-sm" />
                <button type="submit" className="bg-rose-500 text-white px-6 py-2.5 rounded-2xl font-bold w-full sm:w-auto">Añadir</button>
              </form>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedState.wishlist?.map((item) => (
                <div key={item.id} className="group bg-white border border-rose-100 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 uppercase">De {item.addedBy}</span>
                    <button onClick={() => removeWishItem(item)} className="text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-bold text-gray-700 text-base sm:text-lg mb-2">{item.title}</h3>
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-rose-400 font-bold text-xs flex items-center gap-1">Ver producto <ExternalLink className="w-3 h-3" /></a>}
                </div>
              ))}
           </div>
        </section>

        {/* SPOTIFY */}
        <section className="flex justify-center">
          <a href="https://open.spotify.com/playlist/61qef7wUvgDnjoH22qlOQC?si=3f401786c21e4064" target="_blank" rel="noopener noreferrer" className="w-full group relative overflow-hidden bg-gradient-to-r from-[#1DB954] to-[#121212] p-5 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl flex items-center justify-center transition-all hover:scale-[1.01]">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8 z-10">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 transform group-hover:rotate-[720deg] transition-transform duration-[4000ms] ease-in-out">
                 <div className="w-full h-full rounded-full border-4 border-white/20 overflow-hidden shadow-2xl relative">
                    <img src="https://i.pinimg.com/1200x/bb/ff/a0/bbffa0b9e382afb9cd46d70b76900a04.jpg" alt="Playlist Cover" className="w-full h-full object-cover" />
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#121212] rounded-full -translate-x-1/2 -translate-y-1/2 border border-white/10"></div>
                 </div>
              </div>
              <div className="text-center md:text-left">
                <span className="text-white text-xl sm:text-5xl font-black italic font-serif leading-tight">Canciones que me recuerdan a ti</span>
                <p className="text-green-300 text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-widest uppercase mt-3 sm:mt-4">Escuchar nuestra Playlist 🎵</p>
              </div>
            </div>
          </a>
        </section>

        {/* SOBRES ESPECIALES */}
        <section className="space-y-6 sm:space-y-10">
          <div className="text-center">
             <h2 className="text-2xl sm:text-3xl font-black text-gray-800 italic uppercase">Sobres para cada momento</h2>
             <p className="text-gray-400 mt-2">Ábrelos solo cuando sea el momento indicado...</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8">
            {CARDS.map((card, index) => (
              <button key={index} onClick={() => setActiveCard(card)} className={`p-5 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 sm:gap-5 transition-all hover:scale-105 ${card.color} group relative overflow-hidden`}>
                <div className="bg-white/50 p-3 sm:p-5 rounded-2xl group-hover:rotate-12 transition-all">
                  <Mail className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <span className="font-black text-[10px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.2em] text-center leading-tight">{card.title}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center py-12 sm:py-20 bg-white/50 border-t border-rose-100 mt-10">
        <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">Amaro & Danae • Chiikawa Style</p>
      </footer>

      {/* MODAL CARTAS */}
      {activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] sm:rounded-[4rem] max-w-lg w-full p-5 sm:p-12 relative shadow-2xl border-t-[10px] sm:border-t-[16px] border-rose-400 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActiveCard(null)} className="absolute top-4 right-4 sm:top-10 sm:right-10 p-2 sm:p-3 text-gray-300 hover:text-rose-500 bg-gray-50 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-50 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] mb-6 sm:mb-8 w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center border border-rose-100 overflow-hidden shadow-inner">
                <img src={AUTH_CONFIG.lili.avatar} alt="Amaro" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl sm:text-3xl font-black text-gray-800 mb-4 sm:mb-6 italic underline decoration-rose-200 decoration-4">Para Danae cuando {activeCard.title}</h3>
              <p className="text-gray-600 text-lg sm:text-2xl leading-relaxed font-medium italic font-serif">"{activeCard.content}"</p>
              <button onClick={() => setActiveCard(null)} className="mt-8 sm:mt-12 w-full bg-rose-500 text-white font-black py-4 sm:py-6 rounded-[1.25rem] sm:rounded-[2rem] shadow-2xl">Cerrar carta</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fecdd3; border-radius: 20px; }
      `}</style>
    </div>
  );
}

function TimeUnit({ label, value }) {
  return (
    <div className="flex flex-col">
      <div className="bg-white rounded-xl sm:rounded-[2rem] py-5 sm:py-8 shadow-xl border border-rose-50 flex items-center justify-center relative group">
        <span className="text-3xl sm:text-5xl font-black text-rose-500 tabular-nums">
          {typeof value === 'number' ? value.toString().padStart(2, '0') : '00'}
        </span>
      </div>
      <span className="text-[9px] sm:text-[10px] uppercase font-black text-gray-400 mt-2 sm:mt-4 tracking-[0.15em] sm:tracking-widest">{label}</span>
    </div>
  );
}
