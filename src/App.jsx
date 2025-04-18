import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import "react-calendar/dist/Calendar.css";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    avisoDias: 0,
  });

  const hoy = dayjs().startOf("day");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "articulos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setArticulos(data);
    });
    return () => unsub();
  }, []);

  const agregarArticulo = async () => {
    if (!form.nombre || !form.fechaIngreso || !form.fechaVencimiento) return;
    await addDoc(collection(db, "articulos"), form);
    setForm({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 0 });
  };

  const actualizarArticulo = async () => {
    const docRef = doc(db, "articulos", editId);
    await updateDoc(docRef, form);
    setEditId(null);
    setForm({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 0 });
  };

  const eliminarArticulo = async (id) => {
    const docRef = doc(db, "articulos", id);
    await deleteDoc(docRef);
  };

  const filtrarArticulos = () => {
    return articulos.filter((articulo) => {
      const nombreCoincide = articulo.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const vencimiento = dayjs(articulo.fechaVencimiento);
      const diasRestantes = vencimiento.diff(hoy, "day");

      if (filtro === "todos") return nombreCoincide;
      if (filtro === "vigentes") return diasRestantes > 30 && nombreCoincide;
      if (filtro === "por_vencer") return diasRestantes <= 30 && diasRestantes >= 0 && nombreCoincide;
      if (filtro === "vencidos") return diasRestantes < 0 && nombreCoincide;

      return true;
    });
  };

  const getEstado = (vencimiento) => {
    const fecha = dayjs(vencimiento);
    const dias = fecha.diff(hoy, "day");
    if (dias > 30) return "vigente";
    if (dias >= 0) return "por_vencer";
    return "vencido";
  };

  const getBadge = (estado) => {
    if (estado === "vigente") return "badge-vigente";
    if (estado === "por_vencer") return "badge-por_vencer";
    return "badge-vencido";
  };

  return (
    <div className="min-h-screen p-8 bg-[#1E1E2F] text-white">
      <h1 className="text-3xl font-bold text-center mb-8">MARRA</h1>

      <div className="max-w-md mx-auto mb-6">
        <h2 className="text-xl font-semibold mb-2">Calendario</h2>
        <div className="card-dark">
          <Calendar className="rounded-lg w-full bg-[#2A2A3D] text-white" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-full border border-white" onClick={() => setFiltro("todos")}>Todos</button>
        <button className="bg-[#2F4F2F] hover:bg-green-700 text-green-300 px-4 py-1 rounded-full border border-green-400" onClick={() => setFiltro("vigentes")}>Vigentes ✅</button>
        <button className="bg-[#5A4500] hover:bg-yellow-600 text-yellow-300 px-4 py-1 rounded-full border border-yellow-400" onClick={() => setFiltro("por_vencer")}>Por vencer ⚠️</button>
        <button className="bg-[#3F1F1F] hover:bg-red-600 text-red-300 px-4 py-1 rounded-full border border-red-400" onClick={() => setFiltro("vencidos")}>Vencidos ❌</button>
      </div>

      <div className="max-w-4xl mx-auto">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 bg-[#2A2A3D] border border-[#3A3A4F] text-white placeholder-gray-400 rounded px-3 py-2 w-full"
        />

        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrarArticulos().map((art) => (
              <tr key={art.id}>
                <td>{art.nombre}</td>
                <td>{dayjs(art.fechaVencimiento).format("DD/MM/YYYY")}</td>
                <td><span className={getBadge(getEstado(art.fechaVencimiento))}>{getEstado(art.fechaVencimiento)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
