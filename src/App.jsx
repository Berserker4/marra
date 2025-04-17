import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider, db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import dayjs from "dayjs";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const COLORS = ["#4ade80", "#facc15", "#f87171"]; // Verde, Amarillo, Rojo

export default function App() {
  const [user, setUser] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    avisoDias: 0,
  });
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const hoy = dayjs().startOf("day");

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(
    () =>
      onSnapshot(collection(db, "articulos"), (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setArticulos(data);
      }),
    []
  );

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const estadoArticulo = (fecha, aviso) => {
    const venc = dayjs(fecha);
    if (hoy.isAfter(venc)) return "vencido";
    if (hoy.add(aviso, "day").isAfter(venc)) return "por_vencer";
    return "vigente";
  };

  const handleAddOrEdit = async () => {
    if (!form.nombre || !form.fechaIngreso || !form.fechaVencimiento) return;
    const data = {
      ...form,
      autor: {
        uid: user.uid,
        nombre: user.displayName,
        email: user.email,
      },
    };
    if (editId) {
      await updateDoc(doc(db, "articulos", editId), data);
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

  const handleDelete = async (id) =>
    confirm("¿Eliminar?") && deleteDoc(doc(db, "articulos", id));

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
    const coincide = a.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return (filtro === "todos" || filtro === estado) && coincide;
  });

  const resumen = { vigente: 0, por_vencer: 0, vencido: 0 };
  articulos.forEach(
    (a) => resumen[estadoArticulo(a.fechaVencimiento, a.avisoDias)]++
  );

  const pieData = Object.entries(resumen).map(([name, value], i) => ({
    name,
    value,
    fill: COLORS[i],
  }));

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Marra Distribuciones
        </h1>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <span className="text-gray-600">{user.displayName}</span>
          <button
            onClick={logout}
            className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Dashboard + Pie chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-center">
        <div className="bg-green-100 text-green-700 p-4 rounded-xl shadow">
          ✅ Vigentes: <strong>{resumen.vigente}</strong>
        </div>
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-xl shadow">
          ⚠️ Por vencer: <strong>{resumen.por_vencer}</strong>
        </div>
        <div className="bg-red-100 text-red-700 p-4 rounded-xl shadow">
          ❌ Vencidos: <strong>{resumen.vencido}</strong>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-center font-semibold mb-2">
          Distribución de artículos
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex gap-2 flex-wrap">
          {["todos", "vigente", "por_vencer", "vencido"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-full border ${
                filtro === f
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-100"
              }`}
            >
              {f === "todos" ? "Todos" : f.replace("_", " ")}
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

      {/* Formulario + calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow">
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
            onChange={(e) =>
              setForm({ ...form, fechaIngreso: e.target.value })
            }
          />
          <label className="block mb-1">Fecha de vencimiento</label>
          <input
            type="date"
            className="w-full border rounded mb-3 p-2"
            value={form.fechaVencimiento}
            onChange={(e) =>
              setForm({ ...form, fechaVencimiento: e.target.value })
            }
          />
          <label className="block mb-1">Avisar X días antes</label>
          <input
            type="number"
            className="w-full border rounded mb-4 p-2"
            value={form.avisoDias}
            onChange={(e) =>
              setForm({ ...form, avisoDias: Number(e.target.value) })
            }
          />
          <button
            onClick={handleAddOrEdit}
            className="bg-black hover:bg-gray-800 text-white w-full py-2 rounded-xl transition"
          >
            {editId ? "Guardar cambios" : "Agregar artículo"}
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <Calendar value={new Date()} />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full text-left border">
          <thead className="bg-gray-100">
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
              const estado = estadoArticulo(a.fechaVencimiento, a.avisoDias);
              return (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.nombre}</td>
                  <td className="p-3">{a.fechaIngreso}</td>
                  <td className="p-3">{a.fechaVencimiento}</td>
                  <td className="p-3">{a.avisoDias} días</td>
                  <td className="p-3 capitalize">
                    {estado.replace("_", " ")}
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
