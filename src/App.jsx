import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

function PSRentalApp() {
  const [data, setData] = useState([
    { id: 1, tanggal: "2025-09-21 09:12", billing: "Billing 1", lamaJam: 2, stik: 0, harga: 10000, cemilan: 0, status: "Sudah Bayar" },
    { id: 2, tanggal: "2025-09-22 09:31", billing: "Billing 2", lamaJam: 1.5, stik: 1, harga: 7500, cemilan: 5000, status: "Sudah Bayar" },
  ]);

  const [form, setForm] = useState({ id: null, tanggal: "", billing: "", lamaJam: "", stik: "0", harga: "", cemilan: "0", status: "Sudah Bayar" });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterDate, setFilterDate] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddOrEdit = () => {
    if (!form.billing || !form.harga) return;
    if (form.id) {
      setData(data.map((item) => (item.id === form.id ? { ...form, id: form.id, lamaJam: parseFloat(form.lamaJam), stik: parseInt(form.stik), harga: parseInt(form.harga), cemilan: parseInt(form.cemilan) } : item)));
    } else {
      setData([
        ...data,
        {
          id: data.length + 1,
          tanggal: form.tanggal || new Date().toISOString().slice(0, 16).replace("T", " "),
          billing: form.billing,
          lamaJam: parseFloat(form.lamaJam || 0),
          stik: parseInt(form.stik),
          harga: parseInt(form.harga),
          cemilan: parseInt(form.cemilan),
          status: form.status,
        },
      ]);
    }
    setForm({ id: null, tanggal: "", billing: "", lamaJam: "", stik: "0", harga: "", cemilan: "0", status: "Sudah Bayar" });
  };

  const handleEdit = (item) => setForm(item);
  const handleDelete = (id) => setData(data.filter((item) => item.id !== id));

  const filteredData = data.filter((row) => {
    const matchSearch = row.billing.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || row.status === filterStatus;
    const matchDate = !filterDate || row.tanggal.startsWith(filterDate);
    return matchSearch && matchStatus && matchDate;
  });

  const totalPS = filteredData.reduce((acc, row) => acc + row.harga, 0);
  const totalCemilan = filteredData.reduce((acc, row) => acc + row.cemilan, 0);
  const grandTotal = totalPS + totalCemilan;

  const laporanHarian = Object.values(
    filteredData.reduce((acc, row) => {
      const tgl = row.tanggal.split(" ")[0];
      if (!acc[tgl]) acc[tgl] = { tanggal: tgl, total: 0 };
      acc[tgl].total += row.harga + row.cemilan;
      return acc;
    }, {})
  );

  const laporanMingguan = laporanHarian.reduce((acc, row) => acc + row.total, 0);

  // Ekspor ke Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map((row) => ({
      Tanggal: row.tanggal,
      Billing: row.billing,
      LamaJam: row.lamaJam,
      Stik: row.stik,
      Harga: row.harga,
      Cemilan: row.cemilan,
      Status: row.status,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    XLSX.writeFile(wb, "laporan-transaksi.xlsx");
  };

  // Ekspor ke PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Transaksi Hellora Game Corner", 10, 10);
    const tableData = filteredData.map((row) => [
      row.tanggal,
      row.billing,
      row.lamaJam,
      row.stik,
      row.harga,
      row.cemilan,
      row.status,
    ]);
    doc.autoTable({
      head: [["Tanggal", "Billing", "Lama Jam", "Stik", "Harga", "Cemilan", "Status"]],
      body: tableData,
    });
    doc.text("Mengetahui: Olifinia Aziza               Persetujuan: Raihani Zahra Anindika", 10, doc.lastAutoTable.finalY + 10);
    doc.save("laporan-transaksi.pdf");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Hellora Game Corner - Sistem Pembukuan</h1>
      
      {/* Form Transaksi */}
      <div>
        <input
          type="text"
          name="billing"
          value={form.billing}
          onChange={handleChange}
          placeholder="Nama Billing"
          className="p-2 border mb-2"
        />
        <input
          type="number"
          name="lamaJam"
          value={form.lamaJam}
          onChange={handleChange}
          placeholder="Lama Jam"
          className="p-2 border mb-2"
        />
        <input
          type="number"
          name="harga"
          value={form.harga}
          onChange={handleChange}
          placeholder="Harga"
          className="p-2 border mb-2"
        />
        <button onClick={handleAddOrEdit} className="p-2 bg-blue-500 text-white">
          {form.id ? "Edit Transaksi" : "Tambah Transaksi"}
        </button>
      </div>
      
      {/* Data Tabel */}
      <table className="table-auto w-full mt-4">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Billing</th>
            <th>Lama Jam</th>
            <th>Harga</th>
            <th>Cemilan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row) => (
            <tr key={row.id}>
              <td>{row.tanggal}</td>
              <td>{row.billing}</td>
              <td>{row.lamaJam}</td>
              <td>{row.harga}</td>
              <td>{row.cemilan}</td>
              <td>{row.status}</td>
              <td>
                <button onClick={() => handleEdit(row)} className="bg-yellow-500 text-white p-1">Edit</button>
                <button onClick={() => handleDelete(row.id)} className="bg-red-500 text-white p-1">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Laporan */}
      <div className="mt-4">
        <button onClick={handleExportExcel} className="bg-green-500 text-white p-2">Export ke Excel</button>
        <button onClick={handleExportPDF} className="bg-green-500 text-white p-2 ml-2">Export ke PDF</button>
      </div>

      {/* Grafik Pendapatan */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={laporanHarian}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tanggal" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PSRentalApp;
