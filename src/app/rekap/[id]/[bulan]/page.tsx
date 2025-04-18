'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

export default function RekapPage() {
  const { id, bulan } = useParams<{ id: string; bulan: string }>();
  const [pengeluaran, setPengeluaran] = useState<any[]>([]);

  useEffect(() => {
    if (id && bulan) {
      fetchPengeluaran();
    }
  }, [id, bulan]);

  const fetchPengeluaran = async () => {
    const firstDay = `${bulan}-01`;
    const lastDay = new Date(new Date(firstDay).getFullYear(), new Date(firstDay).getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    const { data, error } = await supabase
      .from('pengeluaran')
      .select('*')
      .eq('user_id', id)
      .gte('tanggal', firstDay)
      .lte('tanggal', lastDay);

    if (!error && data) {
      setPengeluaran(data);
    } else {
      console.error('Error:', error);
    }
  };

  const kategoriMap: Record<string, number> = {};
  pengeluaran.forEach(item => {
    kategoriMap[item.kategori] = (kategoriMap[item.kategori] || 0) + item.jumlah;
  });

  const exportToExcel = () => {
    const data = pengeluaran.map((item, index) => ({
      No: index + 1,
      Tanggal: item.tanggal,
      Barang: item.catatan,
      Kategori: item.kategori,
      Jumlah: item.jumlah,
    }));
  
    const sheet = XLSX.utils.json_to_sheet(data, {
      header: ['No', 'Tanggal', 'Barang', 'Kategori', 'Jumlah'],
    });
  
    // Format kolom lebar dan jumlah rata kanan
    const colWidths = [
      { wpx: 40 },  // No
      { wpx: 100 }, // Tanggal
      { wpx: 250 }, // Keterangan
      { wpx: 120 }, // Kategori
      { wpx: 100 }, // Jumlah
    ];
    sheet['!cols'] = colWidths;
  
    // Format jumlah sebagai "Rp" + angka
    data.forEach((item, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: 4 }); // baris ke-i+1, kolom "Jumlah"
      const cell = sheet[cellRef];
      if (cell && typeof item.Jumlah === 'number') {
        cell.t = 's'; // ubah jadi string
        cell.v = 'Rp' + item.Jumlah.toLocaleString('id-ID');
      }
    });
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Rekap Pengeluaran');
    XLSX.writeFile(wb, `Rekap-Pengeluaran.xlsx`);
  }; 
  
  return (
    <div className="min-h-screen bg-white text-black p-6 font-sans flex flex-col relative">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold tracking-wide">REKAP PENGELUARAN</h1>
      </div>
  
      {/* Info User */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">User ID: <span className="font-semibold">{id}</span></p>
        <p className="text-sm text-gray-700">Bulan: <span className="font-semibold">{bulan}</span></p>
      </div>
  
      {/* Tabel dalam scrollable container */}
      <div className="overflow-auto max-h-[500px] border rounded-md">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-200 text-left border border-gray-300">
            <tr>
              <th className="border px-2 py-1 w-[50px]">No</th>
              <th className="border px-2 py-1 w-[120px]">Tanggal</th>
              <th className="border px-2 py-1 w-[40%]">Barang</th>
              <th className="border px-2 py-1 w-[20%]">Kategori</th>
              <th className="border px-2 py-1 w-[20%] text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {pengeluaran.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-1">{index + 1}</td>
                <td className="px-2 py-1">{item.tanggal}</td>
                <td className="px-2 py-1">{item.catatan}</td>
                <td className="px-2 py-1">{item.kategori}</td>
                <td className="px-2 py-1 text-right">Rp{item.jumlah.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  
      {/* Bagian bawah: tombol export & total kategori */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-1 gap-4">
        <button
          onClick={exportToExcel}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow-md"
        >
          Export to Excel
        </button>
  
        <div className="text-sm font-semibold text-right">
          <h2 className="text-base mb-1">Total per Kategori:</h2>
          {Object.entries(kategoriMap).map(([kategori, total], idx) => (
            <p key={idx}>
              {kategori}: Rp{total.toLocaleString('id-ID')}
            </p>
          ))}
        </div>
      </div>
  
      {/* Logo pojok kanan atas */}
      <div className="absolute top-0 right-0 mt-2 mr-4">
        <img src="/Logo Keuangan Pey.png" alt="Logo" className="w-40 h-40 object-contain" />
      </div>
    </div>
  );
}
