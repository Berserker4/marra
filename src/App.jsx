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
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setArticulos(docs);
    });
    return unsub;
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const estadoArticulo = (vencimiento, avisoDias) => {
    const fechaVenc = dayjs(vencimiento);
    if (hoy.isAfter(fechaVenc)) return "vencido";
    if (hoy.add(avisoDias, "day").isAfter(fechaVenc)) return "por_vencer";
    return "vigente";
  };

  const textoEstado = {
    vigente: "Vigente ✅",
    por_vencer: "Por vencer ⚠️",
    vencido: "Vencido ❌",
  };

  const badgeEstado = {
    vigente: "bg-green-200 text-green-800",
    por_vencer: "bg-yellow-200 text-yellow-800",
    vencido: "bg-red-200 text-red-800",
  };

  const handleAddOrEdit = async () => {
    if (!form.nombre || !form.fechaIngreso || !form.fechaVencimiento) return;

    const data = {
      ...form,
      autor: {
        nombre: user.displayName,
        email: user.email,
        uid: user.uid,
      },
    };

    if (editId) {
      const ref = doc(db, "articulos", editId);
      await updateDoc(ref, data);
      setEditId(null);
    } else {
      await addDoc(collection(db, "articulos"), data);
    }

    setForm({
      nombre: "",
      fechaIngreso: "",
      fechaVencimiento: "",
      avisoDias: 0,
    });
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar artículo?")) {
      await deleteDoc(doc(db, "articulos", id));
    }
  };

  const handleEdit = (a) => {
    setForm({
      nombre: a.nombre,
      fechaIngreso: a.fechaIngreso,
      fechaVencimiento: a.fechaVencimiento,
      avisoDias: a.avisoDias,
    });
    setEditId(a.id);
  };

  const filtrados = articulos.filter((a) => {
    const estado = estadoArticulo(a.fechaVencimiento, a.avisoDias);
    const coincideBusqueda = a.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    return (
      (filtro === "todos" || filtro === estado) && coincideBusqueda
    );
  });

  const totalStats = {
    vigente: 0,
    por_vencer: 0,
    vencido: 0,
  };

  articulos.forEach((a) => {
    const estado = estadoArticulo(a.fechaVencimiento, a.avisoDias);
    totalStats[estado]++;
  });

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 text-center">
        <h1 className="text-3xl font-bold mb-4">Marra Distribuciones</h1>
        <p className="mb-4 text-gray-600">Iniciá sesión para continuar</p>
        <button
          onClick={login}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-bold">MARRA DISTRIBUCIONES</h1>
          <p className="text-sm text-gray-500">Hola, {user.displayName}</p>
        </div>
        <button
          onClick={logout}
          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Notificaciones / Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-green-100 text-green-700 p-4 rounded-xl shadow">
          ✅ Vigentes: <strong>{totalStats.vigente}</strong>
        </div>
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-xl shadow">
          ⚠️ Por vencer: <strong>{totalStats.por_vencer}</strong>
        </div>
        <div className="bg-red-100 text-red-700 p-4 rounded-xl shadow">
          ❌ Vencidos: <strong>{totalStats.vencido}</strong>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Todos", value: "todos" },
            { label: "Vigentes ✅", value: "vigente" },
            { label: "Por vencer ⚠️", value: "por_vencer" },
            { label: "Vencidos ❌", value: "vencido" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1 rounded-full border ${
                filtro === f.value
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          className="border p-2 rounded w-full md:w-64"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Formulario y calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border p-6 rounded-2xl shadow bg-white">
          <h2 className="text-lg font-semibold mb-4">
            {editId ? "Editar artículo" : "Nuevo artículo"}
          </h2>
          <label className="block mb-1">Nombre</label>
          <input
            type="text"
            className="w-full border rounded mb-3 p-2"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <label className="block mb-1">Fecha de ingreso</label>
          <input
            type="date"
            className="w-full border rounded mb-3 p-2"
            value={form.fechaIngreso}
            onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })}
          />
          <label className="block mb-1">Fecha de vencimiento</label>
          <input
            type="date"
            className="w-full border rounded mb-3 p-2"
            value={form.fechaVencimiento}
            onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
          />
          <label className="block mb-1">Avisar X días antes</label>
          <input
            type="number"
            className="w-full border rounded mb-4 p-2"
            value={form.avisoDias}
            onChange={(e) => setForm({ ...form, avisoDias: Number(e.target.value) })}
          />
          <button
            onClick={handleAddOrEdit}
            className="bg-black hover:bg-gray-800 text-white w-full py-2 rounded-xl transition"
          >
            {editId ? "Guardar cambios" : "Agregar artículo"}
          </button>
        </div>

        <div className="border p-6 rounded-2xl shadow bg-white">
          <Calendar value={new Date()} />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="w-full text-left border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
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
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.nombre}</td>
                  <td className="p-3">{a.fechaIngreso}</td>
                  <td className="p-3">{a.fechaVencimiento}</td>
                  <td className="p-3">{a.avisoDias} días</td>
                  <td className="p-3">
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${badgeEstado[estado]}`}
                    >
                      {textoEstado[estado]}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {a.autor?.nombre || "—"}
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="px-2 py-1 bg-yellow-300 hover:bg-yellow-400 rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
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
