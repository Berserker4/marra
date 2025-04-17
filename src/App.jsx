import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import "react-calendar/dist/Calendar.css";
import "./App.css";

function App() {
  const [articulos, setArticulos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const [form, setForm] = useState({
    nombre: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    avisoDias: 0,
  });

  const hoy = dayjs().startOf("day");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "articulos"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setArticulos(docs);
    });
    return unsub;
  }, []);

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

    if (editId) {
      const ref = doc(db, "articulos", editId);
      await updateDoc(ref, form);
      setEditId(null);
    } else {
      await addDoc(collection(db, "articulos"), form);
    }

    setForm({
      nombre: "",
      fechaIngreso: "",
      fechaVencimiento: "",
      avisoDias: 0,
    });
  };

  const handleDelete = async (id) => {
    if (confirm("¿Seguro que querés eliminar este artículo?")) {
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
    return filtro === "todos" || filtro === estado;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-center text-3xl font-bold mb-6 text-gray-800">
        MARRA DISTRIBUCIONES
      </h1>

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

      {/* Filtros */}
      <div className="mb-4 flex gap-2 justify-center">
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
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  No hay artículos en esta categoría.
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
