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
  // Estado de autenticación
  const [user, setUser] = useState(null);

  // Lista de artículos
  const [articulos, setArticulos] = useState([]);

  // ID de artículo en edición
  const [editId, setEditId] = useState(null);

  // Filtro de estado y búsqueda
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Formulario de artículo
  const [form, setForm] = useState({
    nombre: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    avisoDias: 0,
  });

  // Calendario
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Fecha de hoy para cálculo de estado
  const hoy = dayjs().startOf("day");

  // Observador de auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Sincronización en tiempo real de artículos
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "articulos"), (snap) => {
      setArticulos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Login / Logout
  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // Determina estado del artículo según fecha y aviso
  const estadoArticulo = (vencimiento, avisoDias) => {
    const v = dayjs(vencimiento);
    if (hoy.isAfter(v)) return "vencido";
    if (hoy.add(avisoDias, "day").isAfter(v)) return "por_vencer";
    return "vigente";
  };

  // Textos y estilos para badges
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

  // Añadir o actualizar artículo
  const handleAddOrEdit = async () => {
    if (!form.nombre || !form.fechaIngreso || !form.fechaVencimiento) return;
    const data = {
      ...form,
      autor: user.displayName || user.email,
    };
    if (editId) {
      await updateDoc(doc(db, "articulos", editId), data);
    } else {
      await addDoc(collection(db, "articulos"), data);
    }
    setEditId(null);
    setForm({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 0 });
  };

  // Eliminar artículo
  const handleDelete = async (id) => {
    if (confirm("¿Eliminar artículo?")) {
      await deleteDoc(doc(db, "articulos", id));
    }
  };

  // Cargar datos al editar
  const handleEdit = (a) => {
    setEditId(a.id);
    setForm({
      nombre: a.nombre,
      fechaIngreso: a.fechaIngreso,
      fechaVencimiento: a.fechaVencimiento,
      avisoDias: a.avisoDias,
    });
  };

  // Filtrado por estado y búsqueda
  const filtrados = articulos.filter((a) => {
    const est = estadoArticulo(a.fechaVencimiento, a.avisoDias);
    const matchFiltro = filtro === "todos" || filtro === est;
    const matchBusqueda = a.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  // Si no está autenticado, mostrar login
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

  // Render principal
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
                ? badgeEstado[estadoArticulo("2025-01-01", 0)].replace(/bg-[^ ]+/, "") + ` bg-${f.val}-600 text-white`
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
        <div className="flex-1 bg-[#3a3a3f] p-6 rounded-xl shadow-lg space-y-4">
          <h2 className="text-xl font-semibold">
            {editId ? "Editar artículo" : "Nuevo artículo"}
          </h2>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full p-2 bg-[#2a2a2a] rounded border border-gray-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={form.fechaIngreso}
              onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })}
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
            className="w-full p-2 bg-[#2a2a2a] rounded border border-gray-600"
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

      {/* Tabla de artículos */}
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
                  <td className="p-3">{a.autor}</td>
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
