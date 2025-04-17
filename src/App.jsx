import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import "react-calendar/dist/Calendar.css";
import "./App.css";

function App() {
  const [articulos, setArticulos] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    avisoDias: 0,
  });

  const hoy = dayjs().startOf("day");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "articulos"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => doc.data());
      setArticulos(docs);
    });
    return unsub;
  }, []);

  const estadoArticulo = (vencimiento, avisoDias) => {
    const fechaVenc = dayjs(vencimiento);
    if (hoy.isAfter(fechaVenc)) return "Vencido ❌";
    if (hoy.add(avisoDias, "day").isAfter(fechaVenc)) return "Por vencer ⚠️";
    return "Vigente ✅";
  };

  const handleAdd = async () => {
    if (!form.nombre || !form.fechaIngreso || !form.fechaVencimiento) return;
    await addDoc(collection(db, "articulos"), form);
    setForm({ nombre: "", fechaIngreso: "", fechaVencimiento: "", avisoDias: 0 });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <h1 className="text-center text-xl font-bold mb-4">MARRA DISTRIBUCIONES</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-4 rounded-xl shadow">
          <label>Nombre</label>
          <input
            type="text"
            className="w-full border mb-2"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <label>Fecha de ingreso</label>
          <input
            type="date"
            className="w-full border mb-2"
            value={form.fechaIngreso}
            onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })}
          />
          <label>Fecha de vencimiento</label>
          <input
            type="date"
            className="w-full border mb-2"
            value={form.fechaVencimiento}
            onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
          />
          <label>Avisar X días antes</label>
          <input
            type="number"
            className="w-full border mb-4"
            value={form.avisoDias}
            onChange={(e) => setForm({ ...form, avisoDias: Number(e.target.value) })}
          />
          <button onClick={handleAdd} className="bg-black text-white w-full py-2 rounded">
            Agregar artículo
          </button>
        </div>

        <div className="border p-4 rounded-xl shadow">
          <Calendar value={new Date()} />
        </div>
      </div>

      <div className="mt-6">
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Nombre</th>
              <th className="p-2">Fecha ingreso</th>
              <th className="p-2">Vencimiento</th>
              <th className="p-2">Aviso</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{a.nombre}</td>
                <td className="p-2">{a.fechaIngreso}</td>
                <td className="p-2">{a.fechaVencimiento}</td>
                <td className="p-2">{a.avisoDias} días</td>
                <td className="p-2">{estadoArticulo(a.fechaVencimiento, a.avisoDias)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
