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
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  const hoy = dayjs().startOf("day");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "articulos"), (snap) => {
      setArticulos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const estadoArticulo = (venc, aviso) => {
    const v = dayjs(venc);
    if (hoy.isAfter(v)) return "vencido";
    if (hoy.add(aviso, "day").isAfter(v)) return "por_vencer";
    return "vigente";
  };

  const textoEstado = {
    vigente: "Vigente ✅",
    por_vencer: "Por vencer ⚠️",
    vencido: "Vencido ❌",
  };

  const badgeEstado = {
    vigente: "bg-green-600 text-white",
    por_vencer: "bg-yellow-500 text-black",
    vencido: "bg-red-600 text-white",
  };

  const handleAddOrEdit = async () => {
    if (!form.nombre || !form.fechaIngreso || !form.fechaVencimiento) return;
    const data = {
      ...form,
      autor: {
        nombre: user.displayName || user.email,
      },
    };
    if (editId) {
      await updateDoc(doc(db, "articulos", editId), data);
    } else {
      await addDoc(collection(db, "articulos"), data);
    }
    setEditId(null);
    setForm({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 0 });
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar artículo?")) {
      await deleteDoc(doc(db, "articulos", id));
    }
  };

  const handleEdit = (a) => {
    setEditId(a.id);
    setForm({
      nombre: a.nombre,
      fechaIngreso: a.fechaIngreso,
      fechaVencimiento: a.fechaVencimiento,
      avisoDias: a.avisoDias,
    });
  };

  const filtrados = articulos.filter((a) => {
    const est = estadoArticulo(a.fechaVencimiento, a.avisoDias);
    return (
      (filtro === "todos" || filtro === est) &&
      a.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#282c34] text-white">
        <h1 className="text-3xl font-bold mb-4">Marra Distribuciones</h1>
        <button
          onClick={login}
          className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#282c34] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Marra Distribuciones</h1>
        <button
          onClick={logout}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Todos", val: "todos" },
          { label: "Vigentes ✅", val: "vigente" },
          { label: "Por vencer ⚠️", val: "por_vencer" },
          { label: "Vencidos ❌", val: "vencido" },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltro(f.val)}
            className={`px-4 py-1 rounded-full border ${
              filtro === f.val
                ? `bg-blue-600 border-blue-600 text-white`
                : "bg-[#3a3a3f] border-gray-600 text-gray-300 hover:bg-[#2a2a2a]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-[#3a3a3f] border border-gray-600 text-white p-2 rounded w-full md:w-64"
        />
      </div>

      {/* Formulario + Calendario */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Formulario */}
        <div className="flex-1 bg-[#3a3a3f] p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            {editId ? "Editar artículo" : "Nuevo artículo"}
          </h2>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full mb-3 p-2 bg-[#2a2a2a] rounded border border-gray-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="date"
              value={form.fechaIngreso}
              onChange={(e) =>
                setForm({ ...form, fechaIngreso: e.target.value })
              }
              className="p-2 bg-[#2a2a2a] rounded border border-gray-600"
            />
            <input
              type="date"
              value={form.fechaVencimiento}
              onChange={(e) =>
                setForm({ ...form, fechaVencimiento: e.target.value })
              }
              className="p-2 bg-[#2a2a2a] rounded border border-gray-600"
            />
          </div>
          <input
            type="number"
            placeholder="Avisar X días antes"
            value={form.avisoDias}
            onChange={(e) =>
              setForm({ ...form, avisoDias: Number(e.target.value) })
            }
            className="w-full mb-4 p-2 bg-[#2a2a2a] rounded border border-gray-600"
          />
          <button
            onClick={handleAddOrEdit}
            className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700"
          >
            {editId ? "Guardar cambios" : "Agregar artículo"}
          </button>
        </div>

        {/* Calendario */}
        <div className="bg-[#3a3a3f] p-4 rounded-xl shadow-lg">
          <Calendar
            onChange={setFechaSeleccionada}
            value={fechaSeleccionada}
            className="bg-[#2a2a2a] text-white rounded-lg border-none"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-[#3a3a3f] rounded-xl shadow-lg">
        <table className="w-full text-left">
          <thead className="bg-[#2a2a2a] text-gray-300">
            <tr>
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
              const est = estadoArticulo(a.fechaVencimiento, a.avisoDias);
              return (
                <tr key={a.id} className="border-t border-gray-700">
                  <td className="p-3">{a.nombre}</td>
                  <td className="p-3">{a.fechaIngreso}</td>
                  <td className="p-3">{a.fechaVencimiento}</td>
                  <td className="p-3">{a.avisoDias} días</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full ${badgeEstado[est]}`}>
                      {textoEstado[est]}
                    </span>
                  </td>
                  <td className="p-3">{a.autor.nombre}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="px-2 py-1 bg-red-600 rounded hover:bg-red-700"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
