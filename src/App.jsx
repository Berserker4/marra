import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";

function App() {
  const [articulos, setArticulos] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  useEffect(() => {
    const obtenerArticulos = async () => {
      const articulosSnapshot = await getDocs(collection(db, "articulos"));
      const articulosData = articulosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArticulos(articulosData);
    };

    obtenerArticulos();
  }, []);

  const filtrarArticulos = (articulo) => {
    const nombreCoincide = articulo.nombre
      .toLowerCase()
      .includes(filtroNombre.toLowerCase());

    const hoy = new Date();
    const fechaVencimiento = new Date(articulo.vencimiento);
    const diferenciaDias = Math.ceil(
      (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)
    );

    if (!nombreCoincide) return false;

    switch (filtro) {
      case "vigente":
        return diferenciaDias > 30;
      case "por_vencer":
        return diferenciaDias <= 30 && diferenciaDias >= 0;
      case "vencido":
        return diferenciaDias < 0;
      default:
        return true;
    }
  };

  const obtenerBadge = (vencimiento) => {
    const hoy = new Date();
    const fechaVencimiento = new Date(vencimiento);
    const diferenciaDias = Math.ceil(
      (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)
    );

    if (diferenciaDias > 30) {
      return <span className="badge-vigente">Vigente</span>;
    } else if (diferenciaDias <= 30 && diferenciaDias >= 0) {
      return <span className="badge-por_vencer">Por vencer</span>;
    } else {
      return <span className="badge-vencido">Vencido</span>;
    }
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">MARRA</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="card-dark">
          <h2 className="text-xl font-semibold mb-4">Calendario</h2>
          <Calendar
            value={fechaSeleccionada}
            onChange={setFechaSeleccionada}
            className="bg-[#2A2A3D] text-white rounded-xl p-4"
            tileClassName="text-white"
            calendarType="US"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { label: "Todos", value: "todos" },
            { label: "Vigentes ✅", value: "vigente" },
            { label: "Por vencer ⚠️", value: "por_vencer" },
            { label: "Vencidos ❌", value: "vencido" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-1.5 rounded-full border text-sm transition duration-200 ${
                filtro === f.value
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-[#1E1E2F] border-gray-500 text-gray-300 hover:bg-[#2A2A3D] hover:border-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Buscador de nombres */}
        <input
          type="text"
          placeholder="Buscar por nombre..."
          className="mb-4"
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
      </div>

      {/* Tabla de artículos */}
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {articulos.filter(filtrarArticulos).map((articulo) => (
              <tr key={articulo.id}>
                <td>{articulo.nombre}</td>
                <td>{new Date(articulo.vencimiento).toLocaleDateString()}</td>
                <td>{obtenerBadge(articulo.vencimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
