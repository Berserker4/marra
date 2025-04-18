import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Calendar } from "react-day-picker";
import 'react-day-picker/index.css';
import "./App.css";

function App() {
  const [articulos, setArticulos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [ingreso, setIngreso] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [aviso, setAviso] = useState("");
  const [id, setId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "articulos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setArticulos(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAgregarArticulo = async () => {
    const user = auth.currentUser;
    if (!nombre || !ingreso || !vencimiento || !aviso) return alert("Faltan campos");

    const nuevoArticulo = {
      nombre,
      ingreso,
      vencimiento,
      aviso,
      autor: user.displayName || user.email,
      estado: calcularEstado(vencimiento),
    };

    if (id) {
      await updateDoc(doc(db, "articulos", id), nuevoArticulo);
    } else {
      await addDoc(collection(db, "articulos"), nuevoArticulo);
    }

    setNombre("");
    setIngreso("");
    setVencimiento("");
    setAviso("");
    setId("");
  };

  const handleEliminarArticulo = async (id) => {
    await deleteDoc(doc(db, "articulos", id));
  };

  const handleEditarArticulo = (articulo) => {
    setNombre(articulo.nombre);
    setIngreso(articulo.ingreso);
    setVencimiento(articulo.vencimiento);
    setAviso(articulo.aviso);
    setId(articulo.id);
  };

  const handleLogout = () => signOut(auth);

  const calcularEstado = (vencimiento) => {
    const hoy = new Date();
    const fechaVencimiento = new Date(vencimiento);
    const diff = (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24);

    if (diff < 0) return "Vencido";
    if (diff <= 7) return "Por vencer";
    return "Vigente";
  };

  const filtrarArticulos = () => {
    return articulos
      .filter((a) => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      .filter((a) =>
        filtro === "todos" ? true : a.estado.toLowerCase() === filtro.toLowerCase()
      );
  };

  const vigentesCount = articulos.filter((a) => a.estado === "Vigente").length;
  const porVencerCount = articulos.filter((a) => a.estado === "Por vencer").length;
  const vencidosCount = articulos.filter((a) => a.estado === "Vencido").length;

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">Marra Distribuciones</h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-6 justify-center">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="p-2 rounded bg-gray-800 text-white border border-gray-700"
          />
          <input
            type="date"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
            placeholder="dd/mm/aaaa"
            className="p-2 rounded bg-gray-800 text-white border border-gray-700"
          />
          <input
            type="date"
            value={vencimiento}
            onChange={(e) => setVencimiento(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white border border-gray-700"
          />
          <input
            type="text"
            value={aviso}
            onChange={(e) => setAviso(e.target.value)}
            placeholder="Días de aviso"
            className="p-2 rounded bg-gray-800 text-white border border-gray-700"
          />
          <button
            onClick={handleAgregarArticulo}
            className="col-span-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Agregar artículo
          </button>
        </div>

        <div className="w-full md:w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border border-gray-700 bg-gray-800 text-white shadow p-4"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <div className="bg-green-700 text-white font-semibold py-2 px-4 rounded flex items-center gap-2">
          ✅ Vigentes: {vigentesCount}
        </div>
        <div className="bg-yellow-600 text-white font-semibold py-2 px-4 rounded flex items-center gap-2">
          ⚠️ Por vencer: {porVencerCount}
        </div>
        <div className="bg-red-700 text-white font-semibold py-2 px-4 rounded flex items-center gap-2">
          ❌ Vencidos: {vencidosCount}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <button onClick={() => setFiltro("todos")} className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded">
          Todos
        </button>
        <button onClick={() => setFiltro("vigentes")} className="bg-green-800 hover:bg-green-900 px-4 py-2 rounded">
          Vigentes ✅
        </button>
        <button onClick={() => setFiltro("por vencer")} className="bg-yellow-800 hover:bg-yellow-900 px-4 py-2 rounded">
          Por vencer ⚠️
        </button>
        <button onClick={() => setFiltro("vencido")} className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded">
          Vencidos ❌
        </button>
      </div>

      <div className="mt-6 flex justify-center">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-1/2 p-2 rounded bg-gray-800 text-white border border-gray-700"
        />
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full border border-gray-700 rounded text-sm">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="p-2">Nombre</th>
              <th className="p-2">Ingreso</th>
              <th className="p-2">Vencimiento</th>
              <th className="p-2">Aviso</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Autor</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrarArticulos().map((articulo) => (
              <tr key={articulo.id} className="text-center border-t border-gray-700">
                <td className="p-2">{articulo.nombre}</td>
                <td className="p-2">{articulo.ingreso}</td>
                <td className="p-2">{articulo.vencimiento}</td>
                <td className="p-2">{articulo.aviso}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-white text-xs ${
                    articulo.estado === 'Vigente' ? 'bg-green-600' :
                    articulo.estado === 'Por vencer' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}>
                    {articulo.estado}
                  </span>
                </td>
                <td className="p-2">{articulo.autor}</td>
                <td className="p-2 flex justify-center gap-2">
                  <button onClick={() => handleEditarArticulo(articulo)} className="bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded">
                    ✏️
                  </button>
                  <button onClick={() => handleEliminarArticulo(articulo.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
