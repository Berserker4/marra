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
      <div className="h-screen flex flex-col items-center justify-center bg-[#1E1E2F] text-center">
        <h1 className="text-3xl font-bold mb-4">Marra Distribuciones</h1>
        <p className="mb-4 text-gray-400">Iniciá sesión para continuar</p>
        <button
          onClick={login}
          className="bg-blue-500 hover:bg-blue-600"
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
          <p className="text-sm text-gray-400">Hola, {user.displayName}</p>
        </div>
        <button
          onClick={logout}
          className="bg-gray-300 hover:bg-[#4A4A5F]"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="card-dark text-green-300">✅ Vigentes: <strong>{totalStats.vigente}</strong></div>
        <div className="card-dark text-yellow-300">⚠️ Por vencer: <strong>{totalStats.por_vencer}</strong></div>
        <div className="card-dark text-red-300">❌ Vencidos: <strong>{totalStats.vencido}</strong></div>
      </div>

      {/* Formulario y calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card-dark">
          <h2 className="text-lg font-semibold mb-4">
            {editId ? "Editar artículo" : "Nuevo artículo"}
          </h2>
          <label className="block mb-1">Nombre</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <label className="block mt-3 mb-1">Fecha de ingreso</label>
          <input
            type="date"
            value={form.fechaIngreso}
            onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })}
          />
          <label className="block mt-3 mb-1">Fecha de vencimiento</label>
          <input
            type="date"
            value={form.fechaVencimiento}
            onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
          />
          <label className="block mt-3 mb-1">Avisar X días antes</label>
          <input
            type="number"
            value={form.avisoDias}
            onChange={(e) => setForm({ ...form, avisoDias: Number(e.target.value) })}
          />
          <button
            onClick={handleAddOrEdit}
            className="bg-black hover:bg-gray-800 mt-4"
          >
            {editId ? "Guardar cambios" : "Agregar artículo"}
          </button>
        </div>

        <div className="card-dark">
          <Calendar
            value={new Date()}
            className="!bg-[#2A2A3D] !text-white rounded-xl p-4"
            calendarType="gregory"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["todos", "vigente", "por_vencer", "vencido"].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={`border ${
              filtro === estado ? "bg-blue-500" : "bg-[#2A2A3D] text-gray-300"
            }`}
          >
            {textoEstado[estado] || "Todos"}
          </button>
        ))}
      </div>

      {/* Buscador arriba de tabla */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl shadow bg-[#2A2A3D]">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ingreso</th>
              <th>Vencimiento</th>
              <th>Aviso</th>
              <th>Estado</th>
              <th>Autor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a) => {
              const estado = estadoArticulo(a.fechaVencimiento, a.avisoDias);
              return (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{a.fechaIngreso}</td>
                  <td>{a.fechaVencimiento}</td>
                  <td>{a.avisoDias} días</td>
                  <td>
                    <span className={`badge-${estado}`}>{textoEstado[estado]}</span>
                  </td>
                  <td>{a.autor?.nombre || "—"}</td>
                  <td className="space-x-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="bg-yellow-300 hover:bg-yellow-400 text-black"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-gray-400 p-4">
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
