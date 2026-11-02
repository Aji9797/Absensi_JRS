import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AttendanceRecord } from '../types/attendance';

/**
 * Clean data formatter for payroll exports
 */
export function formatRecordsForExport(records: AttendanceRecord[]) {
  return records.map((log, index) => {
    return {
      No: index + 1,
      'ID Presensi': log.id,
      'ID Karyawan': log.employeeId,
      'Nama Karyawan': log.employeeName,
      'Jabatan / Divisi': log.employeeRole,
      'Tanggal': log.date,
      'Hari': log.dayName,
      'Jam Masuk': log.clockInTime,
      'Jam Keluar': log.clockOutTime || 'Aktif / Belum Pulang',
      'Durasi Kerja': log.workDurationHours || '-',
      'Lokasi Kantor': log.officeName,
      'Jarak Geofence': `${log.distanceMeters} meter`,
      'Status Kehadiran':
        log.status === 'ON_TIME'
          ? 'Tepat Waktu'
          : log.status === 'LATE'
          ? 'Terlambat'
          : log.status === 'SICK_LEAVE'
          ? 'Izin Sakit'
          : log.status,
      'Verifikasi Wajah Biometrik': log.isVerifiedFace ? 'VALID (Liveness OK)' : 'NON-BIOMETRIK',
      'Koordinat GPS': `${log.latitude.toFixed(5)}, ${log.longitude.toFixed(5)}`,
    };
  });
}

/**
 * 1. Export filtered attendance records to CSV
 */
export function exportAttendanceToCSV(
  records: AttendanceRecord[],
  filename = `Rekap_Presensi_Payroll_${new Date().toISOString().slice(0, 10)}.csv`
) {
  const formatted = formatRecordsForExport(records);
  if (formatted.length === 0) return;

  const headers = Object.keys(formatted[0]);
  const csvRows = [
    headers.join(','),
    ...formatted.map((row) =>
      headers
        .map((header) => {
          const val = (row as any)[header] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. Export filtered attendance records to formatted Excel (.xlsx) workbook
 */
export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  filename = `Rekap_Presensi_Payroll_${new Date().toISOString().slice(0, 10)}.xlsx`,
  options?: { officeFilter?: string; statusFilter?: string }
) {
  const formatted = formatRecordsForExport(records);

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(formatted);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 16 }, // ID Presensi
    { wch: 14 }, // ID Karyawan
    { wch: 22 }, // Nama Karyawan
    { wch: 26 }, // Jabatan
    { wch: 14 }, // Tanggal
    { wch: 8 },  // Hari
    { wch: 14 }, // Jam Masuk
    { wch: 16 }, // Jam Keluar
    { wch: 14 }, // Durasi Kerja
    { wch: 26 }, // Lokasi Kantor
    { wch: 16 }, // Jarak Geofence
    { wch: 16 }, // Status
    { wch: 24 }, // Verifikasi Wajah
    { wch: 24 }, // Koordinat GPS
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Presensi Payroll');

  // Summary sheet for HR Payroll
  const summaryData = [
    { Parameter: 'Nama Dokumen', Nilai: 'Rekapitulasi Presensi Karyawan untuk Penggajian (Payroll)' },
    { Parameter: 'Tanggal Dibuat', Nilai: new Date().toLocaleString('id-ID') },
    { Parameter: 'Total Baris Data', Nilai: records.length },
    { Parameter: 'Filter Kantor', Nilai: options?.officeFilter || 'Semua Kantor' },
    { Parameter: 'Filter Status', Nilai: options?.statusFilter || 'Semua Status' },
    { Parameter: 'Verifikasi Biometrik Valid', Nilai: records.filter((r) => r.isVerifiedFace).length },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan Payroll');

  // Write file
  XLSX.writeFile(wb, filename);
}

/**
 * 3. Export filtered attendance records to formal PDF report with header and signature
 */
export function exportAttendanceToPDF(
  records: AttendanceRecord[],
  filename = `Laporan_Presensi_Payroll_${new Date().toISOString().slice(0, 10)}.pdf`,
  options?: { officeFilter?: string; statusFilter?: string; searchFilter?: string }
) {
  // Landscape orientation A4 for tabular payroll readability
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Header Title
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PT JRS INDONESIA - REKAPITULASI PRESENSI & PAYROLL KARYAWAN', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `JRS GeoFace Attendance System · Validasi Kehadiran Geofence GPS & Biometrik Wajah · Dicetak: ${todayStr}`,
    14,
    17
  );

  // Metadata Subheader Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI REKAPITULASI PENGGAJIAN:', 14, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const filterInfo = [
    `Total Data: ${records.length} Baris Presensi`,
    `Filter Kantor: ${options?.officeFilter || 'Semua Titik Kantor'}`,
    `Filter Status: ${options?.statusFilter || 'Semua Status'}`,
    options?.searchFilter ? `Pencarian: "${options.searchFilter}"` : null,
  ]
    .filter(Boolean)
    .join('   |   ');

  doc.text(filterInfo, 14, 34);

  // Prepare table data
  const headers = [
    'No',
    'Nama Karyawan',
    'Jabatan',
    'Tanggal',
    'Masuk',
    'Pulang',
    'Durasi',
    'Kantor',
    'Jarak (m)',
    'Status',
    'Wajah',
  ];

  const bodyData = records.map((log, idx) => [
    idx + 1,
    log.employeeName,
    log.employeeRole,
    `${log.dayName}, ${log.date}`,
    log.clockInTime,
    log.clockOutTime || '--:--',
    log.workDurationHours || '-',
    log.officeName.length > 20 ? log.officeName.slice(0, 20) + '...' : log.officeName,
    `${log.distanceMeters}m`,
    log.status === 'ON_TIME'
      ? 'Tepat Waktu'
      : log.status === 'LATE'
      ? 'Terlambat'
      : log.status === 'SICK_LEAVE'
      ? 'Izin Sakit'
      : log.status,
    log.isVerifiedFace ? 'Valid OK' : 'Non-Biometrik',
  ]);

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: bodyData,
    startY: 38,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [37, 99, 235], // Blue 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // No
      1: { cellWidth: 35 }, // Name
      2: { cellWidth: 35 }, // Role
      3: { cellWidth: 28 }, // Date
      4: { cellWidth: 20 }, // In
      5: { cellWidth: 20 }, // Out
      6: { cellWidth: 18 }, // Duration
      7: { cellWidth: 36 }, // Office
      8: { cellWidth: 16, halign: 'right' }, // Distance
      9: { cellWidth: 22, halign: 'center' }, // Status
      10: { cellWidth: 20, halign: 'center' }, // Face
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} · Dokumen ini sah dan diverifikasi secara digital oleh GeoFace Attendance Engine`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  // Signatures section at bottom of last page
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const pageHeight = doc.internal.pageSize.getHeight();

  if (finalY < pageHeight - 35) {
    const sigY = finalY;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Left sign: HR Payroll Specialist
    doc.text('Diverifikasi oleh (HR Payroll):', 14, sigY);
    doc.line(14, sigY + 15, 64, sigY + 15);
    doc.text('Natasha Kirovska', 14, sigY + 19);
    doc.setFontSize(7);
    doc.text('Head of HR & Business Dev', 14, sigY + 23);

    // Right sign: Finance / General Manager
    doc.setFontSize(8);
    doc.text('Disetujui oleh (Finance & Ops):', pageWidth - 70, sigY);
    doc.line(pageWidth - 70, sigY + 15, pageWidth - 20, sigY + 15);
    doc.text('Finance & Operational Dir.', pageWidth - 70, sigY + 19);
    doc.setFontSize(7);
    doc.text('Executive Management', pageWidth - 70, sigY + 23);
  }

  // Save PDF
  doc.save(filename);
}
