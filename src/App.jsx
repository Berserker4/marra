import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './App.css';

const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_AUTH_DOMAIN',
  projectId: 'TU_PROJECT_ID',
  storageBucket: 'TU_BUCKET',
  messagingSenderId: 'TU_SENDER_ID',
  appId: 'TU_APP_ID',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [nuevoArticulo, setNuevoArticulo] = useState({ nombre: '', stock: 0 });
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [fecha, setFecha] = useState(new Date());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUser(usuarioFirebase);
      if (usuarioFirebase) {
        obtenerArticulos();
      }
    });
    return () => unsub();
  }, []);

  const obtenerArticulos = async () => {
    const querySnapshot = await getDocs(collection(db, 'articulos'));
    setArticulos(
      querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    );
  };

  const agregarArticulo = async () => {
    if (!nuevoArticulo.nombre || !nuevoArticulo.stock) return;
    await addDoc(collection(db, 'articulos'), nuevoArticulo);
    setNuevoArticulo({ nombre: '', stock: 0 });
    obtenerArticulos();
  };

  const eliminarArticulo = async (id) => {
    await deleteDoc(doc(db, 'articulos', id));
    obtenerArticulos();
  };

  const actualizarArticulo = async () => {
    const articuloRef = doc(db, 'articulos', editandoId);
    await updateDoc(articuloRef, nuevoArticulo);
    setEditandoId(null);
    setNuevoArticulo({ nombre: '', stock: 0 });
    obtenerArticulos();
  };

  const handleLogin = async () => {
    await signInWithEmailAndPassword(auth, 'admin@marra.com', '123456');
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const articulosFiltrados = articulos.filter((art) =>
    art.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {!user ? (
        <div className="flex justify-center mt-20">
          <button
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Iniciar Sesión
          </button>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Marra Distribuciones</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="bg-neutral-900 rounded-xl p-4 shadow-md">
            <label className="block mb-2">Filtrar por nombre:</label>
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full p-2 rounded bg-neutral-800 text-white"
              placeholder="Buscar artículo..."
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-neutral-900 rounded-xl p-4">
              <label className="block">Nombre:</label>
              <input
                type="text"
                value={nuevoArticulo.nombre}
                onChange={(e) =>
                  setNuevoArticulo({ ...nuevoArticulo, nombre: e.target.value })
                }
                className="w-full p-2 rounded bg-neutral-800 text-white mb-2"
              />
              <label className="block">Stock:</label>
              <input
                type="number"
                value={nuevoArticulo.stock}
                onChange={(e) =>
                  setNuevoArticulo({ ...nuevoArticulo, stock: Number(e.target.value) })
                }
                className="w-full p-2 rounded bg-neutral-800 text-white mb-2"
              />

              {editandoId ? (
                <button
                  onClick={actualizarArticulo}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded mt-2"
                >
                  Guardar Cambios
                </button>
              ) : (
                <button
                  onClick={agregarArticulo}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mt-2"
                >
                  Agregar
                </button>
              )}
            </div>

            <div className="bg-neutral-900 rounded-xl p-4">
              <DayPicker
                mode="single"
                selected={fecha}
                onSelect={setFecha}
                styles={{
                  caption: { color: 'white' },
                  day: { color: 'white' },
                }}
                className="bg-black text-white rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-neutral-900 rounded-xl p-4 shadow-md">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {articulosFiltrados.map((art) => (
                  <tr key={art.id} className="border-t border-neutral-700">
                    <td className="px-4 py-2">{art.nombre}</td>
                    <td className="px-4 py-2">{art.stock}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => {
                          setEditandoId(art.id);
                          setNuevoArticulo({ nombre: art.nombre, stock: art.stock });
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarArticulo(art.id)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
