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

const COLORS = ["#22c55e", "#eab308", "#ef4444"];

export default function App() {
  const [user, setUser] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [form, setForm] = useState({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 0 });
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const hoy = dayjs().startOf("day");

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => onSnapshot(collection(db, "articulos"), snap => {
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setArticulos(data);
  }), []);

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
    const data = { ...form, autor: { uid: user.uid, nombre: user.displayName, email: user.email } };
    if (editId) {
      await updateDoc(doc(db, "articulos", editId), data);
      setEditId(null);
    } else {
      await addDoc(collection(db, "articulos"), data);
    }
    setForm({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 0 });
  };

  const handleDelete = async (id) => confirm("¿Eliminar?") && deleteDoc(doc(db, "articulos", id));
  const handleEdit = (a) => {
    setForm({ nombre: a.nombre, fechaIngreso: a.fechaIngreso, fechaVencimiento: a.fechaVencimiento, avisoDias: a.avisoDias });
    setEditId(a.id);
  };

  const filtrados = articulos.filter(a => {
    const estado = estadoArticulo(a.fechaVencimiento, a.avisoDias);
    const coincide = a.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return (filtro === "todos" || filtro === estado) && coincide;
  });

  const resumen = { vigente: 0, por_vencer: 0, vencido: 0 };
  articulos.forEach(a => resumen[estadoArticulo(a.fechaVencimiento, a.avisoDias)]++);

  const pieData = Object.entries(resumen).map(([name, value], i) => ({ name, value, fill: COLORS[i] }));

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
        <h1 className="text-3xl font-bold mb-4">Marra Distribuciones</h1>
        <button onClick={login} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white">Iniciar sesión con Google</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 md:px-8 py-6 font-sans space-y-10">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Marra Distribuciones</h1>
        <div className="flex gap-3 items-center">
          <span className="text-zinc-400">{user.displayName}</span>
          <button onClick={logout} className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-md text-sm">Cerrar sesión</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Vigentes", valor: resumen.vigente, color: "text-green-400" },
          { label: "Por vencer", valor: resumen.por_vencer, color: "text-yellow-400" },
          { label: "Vencidos", valor: resumen.vencido, color: "text-red-400" }
        ].map(({ label, valor, color }, i) => (
          <div key={i} className="bg-zinc-800 rounded-2xl p-4 shadow text-center">
            <p className={`${color} font-bold text-lg`}>{label}</p>
            <p className="text-2xl font-semibold">{valor}</p>
          </div>
        ))}
      </section>

      <section className="bg-zinc-900 rounded-2xl p-4 shadow">
        <h2 className="text-center mb-4 text-lg font-semibold">Distribución de artículos</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} />
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-bold mb-4">{editId ? "Editar artículo" : "Nuevo artículo"}</h3>
          {['nombre', 'fechaIngreso', 'fechaVencimiento', 'avisoDias'].map((campo, i) => (
            <div key={i} className="mb-3">
              <label className="block text-sm mb-1 capitalize">{campo.replace("fecha", "Fecha ").replace("avisoDias", "Avisar días antes")}</label>
              <input
                type={campo.includes("fecha") ? "date" : campo === "avisoDias" ? "number" : "text"}
                className="w-full bg-zinc-800 text-white border border-zinc-600 rounded p-2"
                value={form[campo]}
                onChange={(e) => setForm({ ...form, [campo]: campo === "avisoDias" ? Number(e.target.value) : e.target.value })}
              />
            </div>
          ))}
          <button onClick={handleAddOrEdit} className="w-full bg-blue-600 text-white py-2 rounded-xl mt-3 hover:bg-blue-700">
            {editId ? "Guardar cambios" : "Agregar artículo"}
          </button>
        </div>
        <div className="bg-zinc-900 p-6 rounded-2xl shadow">
          <Calendar value={new Date()} className="REACT-CALENDAR p-2 rounded-xl" />
        </div>
      </section>

      <section className="bg-zinc-900 p-4 rounded-2xl shadow space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {["todos", "vigente", "por_vencer", "vencido"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-1 rounded-full text-sm ${filtro === f ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-blue-800"}`}
              >
                {f === "todos" ? "Todos" : f.replace("_", " ")}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="bg-zinc-800 text-white px-4 py-2 rounded-md w-full md:w-64 placeholder-zinc-400"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-800">
              <tr>
                {["Nombre", "Ingreso", "Vencimiento", "Aviso", "Estado", "Autor", "Acciones"].map((t, i) => (
                  <th key={i} className="p-3 text-sm text-zinc-300">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => {
                const estado = estadoArticulo(a.fechaVencimiento, a.avisoDias);
                return (
                  <tr key={a.id} className="border-t border-zinc-700 hover:bg-zinc-800">
                    <td className="p-3">{a.nombre}</td>
                    <td className="p-3">{a.fechaIngreso}</td>
                    <td className="p-3">{a.fechaVencimiento}</td>
                    <td className="p-3">{a.avisoDias} días</td>
                    <td className="p-3 capitalize">{estado.replace("_", " ")}</td>
                    <td className="p-3 text-sm text-zinc-400">{a.autor?.nombre || "—"}</td>
                    <td className="p-3 space-x-2">
                      <button onClick={() => handleEdit(a)} className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 rounded">✏️</button>
                      <button onClick={() => handleDelete(a.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded">🗑️</button>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-zinc-400">No hay artículos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
