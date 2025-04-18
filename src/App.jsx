import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [articulos, setArticulos] = useState([]);
  const [nuevoArticulo, setNuevoArticulo] = useState({
    nombre: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    avisoDias: 30,
  });
  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [value, onChange] = useState(new Date());

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario(user);
        const q = query(collection(db, "articulos"), orderBy("fechaVencimiento"));
        onSnapshot(q, (snapshot) => {
          setArticulos(
            snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            }))
          );
        });
      } else {
        setUsuario(null);
      }
    });
  }, []);

  const agregarArticulo = async () => {
    if (
      !nuevoArticulo.nombre ||
      !nuevoArticulo.fechaIngreso ||
      !nuevoArticulo.fechaVencimiento
    )
      return;
    await addDoc(collection(db, "articulos"), {
      ...nuevoArticulo,
      avisoDias: parseInt(nuevoArticulo.avisoDias),
      autor: { uid: usuario.uid, nombre: usuario.email },
      creado: Timestamp.now(),
    });
    setNuevoArticulo({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 30 });
  };

  const handleEdit = (articulo) => {
    setEditando(articulo);
    setNuevoArticulo({
      nombre: articulo.nombre,
      fechaIngreso: articulo.fechaIngreso,
      fechaVencimiento: articulo.fechaVencimiento,
      avisoDias: articulo.avisoDias,
    });
  };

  const guardarEdicion = async () => {
    await updateDoc(doc(db, "articulos", editando.id), nuevoArticulo);
    setEditando(null);
    setNuevoArticulo({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 30 });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "articulos", id));
  };

  const logout = () => {
    signOut(auth);
  };

  const estadoArticulo = (fechaVencimiento, avisoDias) => {
    const hoy = new Date();
    const fechaVen = new Date(fechaVencimiento);
    const diff = (fechaVen - hoy) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "vencido";
    if (diff <= avisoDias) return "por_vencer";
    return "vigente";
  };

  const badgeEstado = {
    vigente: "bg-green-800 text-white",
    por_vencer: "bg-yellow-600 text-black",
    vencido: "bg-red-800 text-white",
  };

  const textoEstado = {
    vigente: "Vigente",
    por_vencer: "Por vencer",
    vencido: "Vencido",
  };

  const filtrados = articulos
    .filter((a) => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter((a) => {
      if (filtro === "todos") return true;
      return estadoArticulo(a.fechaVencimiento, a.avisoDias) === filtro;
    });

  const totalStats = {
    vigente: articulos.filter((a) => estadoArticulo(a.fechaVencimiento, a.avisoDias) === "vigente").length,
    por_vencer: articulos.filter((a) => estadoArticulo(a.fechaVencimiento, a.avisoDias) === "por_vencer").length,
    vencido: articulos.filter((a) => estadoArticulo(a.fechaVencimiento, a.avisoDias) === "vencido").length,
  };

  return (
    <div className="p-4 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-4">Marra Distribuciones</h1>

      <div className="flex justify-between items-center mb-4">
        <div>
          <button onClick={logout} className="bg-red-600 px-3 py-1 rounded">
            Cerrar sesión
          </button>
        </div>
        <Calendar onChange={onChange} value={value} className="bg-black text-white rounded-lg p-2 border border-gray-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Nombre"
          className="bg-[#1E1E2F] border border-gray-600 text-white p-2 rounded"
          value={nuevoArticulo.nombre}
          onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, nombre: e.target.value })}
        />
        <input
          type="date"
          placeholder="Fecha de ingreso"
          className="bg-[#1E1E2F] border border-gray-600 text-white p-2 rounded"
          value={nuevoArticulo.fechaIngreso}
          onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, fechaIngreso: e.target.value })}
        />
        <input
          type="date"
          placeholder="Fecha de vencimiento"
          className="bg-[#1E1E2F] border border-gray-600 text-white p-2 rounded"
          value={nuevoArticulo.fechaVencimiento}
          onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, fechaVencimiento: e.target.value })}
        />
        <input
          type="number"
          placeholder="Días de aviso"
          className="bg-[#1E1E2F] border border-gray-600 text-white p-2 rounded"
          value={nuevoArticulo.avisoDias}
          onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, avisoDias: e.target.value })}
        />
      </div>
      <div className="mb-6">
        {editando ? (
          <button onClick={guardarEdicion} className="bg-yellow-500 px-4 py-2 rounded mr-2">
            Guardar cambios
          </button>
        ) : (
          <button onClick={agregarArticulo} className="bg-blue-600 px-4 py-2 rounded">
            Agregar artículo
          </button>
        )}
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-green-800 text-white p-4 rounded-xl shadow">✅ Vigentes: <strong>{totalStats.vigente}</strong></div>
        <div className="bg-yellow-600 text-black p-4 rounded-xl shadow">⚠️ Por vencer: <strong>{totalStats.por_vencer}</strong></div>
        <div className="bg-red-800 text-white p-4 rounded-xl shadow">❌ Vencidos: <strong>{totalStats.vencido}</strong></div>
      </div>

      {/* Filtros personalizados */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltro("todos")}
            className={`px-4 py-1 rounded-full border ${
              filtro === "todos"
                ? "bg-blue-600 text-white"
                : "bg-[#2A2A3D] text-white border-gray-600 hover:bg-blue-800"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro("vigente")}
            className={`px-4 py-1 rounded-full border ${
              filtro === "vigente"
                ? "bg-green-600 text-white"
                : "bg-[#2A2A3D] text-white border-gray-600 hover:bg-green-800"
            }`}
          >
            Vigentes ✅
          </button>
          <button
            onClick={() => setFiltro("por_vencer")}
            className={`px-4 py-1 rounded-full border ${
              filtro === "por_vencer"
                ? "bg-yellow-400 text-black"
                : "bg-[#2A2A3D] text-white border-gray-600 hover:bg-yellow-500"
            }`}
          >
            Por vencer ⚠️
          </button>
          <button
            onClick={() => setFiltro("vencido")}
            className={`px-4 py-1 rounded-full border ${
              filtro === "vencido"
                ? "bg-red-600 text-white"
                : "bg-[#2A2A3D] text-white border-gray-600 hover:bg-red-700"
            }`}
          >
            Vencidos ❌
          </button>
        </div>
      </div>

      {/* Buscador de nombre arriba de la tabla */}
      <div className="flex justify-end mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          className="bg-[#1E1E2F] border border-gray-600 text-white p-2 rounded w-full md:w-64"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl shadow bg-[#2A2A3D]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#3A3A50] text-gray-300">
              <th className="p-3">Nombre</th>
              <th className="p-3">Ingreso</th>
              <th className="p-3">Vencimiento</th>
              <th className="p-3">Aviso</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Autor</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a) => {
              const estado = estadoArticulo(a.fechaVencimiento, a.avisoDias);
              return (
                <tr key={a.id} className="border-t border-gray-700">
                  <td className="p-3">{a.nombre}</td>
                  <td className="p-3">{a.fechaIngreso}</td>
                  <td className="p-3">{a.fechaVencimiento}</td>
                  <td className="p-3">{a.avisoDias} días</td>
                  <td className="p-3">
                    <span className={`text-sm px-2 py-1 rounded-full ${badgeEstado[estado]}`}>
                      {textoEstado[estado]}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-400">{a.autor?.nombre || "—"}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No hay artículos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;