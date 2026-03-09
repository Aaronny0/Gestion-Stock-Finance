'use client';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Product {
    id: string;
    model: string;
    quantity: number;
    unit_price: number | null;
    brands?: { name: string };
    updated_at: string;
}

interface ExportDataProps {
    data: Product[];
    filename?: string;
}

export default function ExportData({ data, filename = 'inventaire' }: ExportDataProps) {
    const exportToExcel = () => {
        const today = format(new Date(), 'dd-MM-yyyy_HH-mm');
        const excelData = data.map(p => ({
            'Marque': p.brands?.name || '—',
            'Modèle': p.model,
            'Quantité': p.quantity,
            'Prix Unitaire': p.unit_price ? p.unit_price : '—',
            'Valeur Totale': p.unit_price ? (p.unit_price * p.quantity) : '—',
            'Dernière MAJ': format(new Date(p.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        // Column widths
        worksheet['!cols'] = [
            { wch: 15 }, // Marque
            { wch: 25 }, // Modèle
            { wch: 10 }, // Quantité
            { wch: 15 }, // Prix
            { wch: 15 }, // Valeur Totale
            { wch: 20 }  // MAJ
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire');
        XLSX.writeFile(workbook, `${filename}_${today}.xlsx`);
    };

    const exportToPDF = () => {
        const today = format(new Date(), 'dd-MM-yyyy_HH-mm');
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Inventaire VORTEX`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Généré le: ${format(new Date(), 'dd MMM yyyy à HH:mm', { locale: fr })}`, 14, 22);
        
        const tableColumn = ["Marque", "Modèle", "Qté", "P.U", "Valeur Totale", "Dernière MAJ"];
        const tableRows: any[] = [];

        let totalValue = 0;
        let totalItems = 0;

        data.forEach(p => {
            if (p.unit_price) totalValue += p.unit_price * p.quantity;
            totalItems += p.quantity;

            const productData = [
                p.brands?.name || '—',
                p.model,
                p.quantity.toString(),
                p.unit_price ? formatCurrency(p.unit_price) : '—',
                p.unit_price ? formatCurrency(p.unit_price * p.quantity) : '—',
                format(new Date(p.updated_at), 'dd/MM/yyyy', { locale: fr })
            ];
            tableRows.push(productData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] }, // Indigo color
            styles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' },
                5: { cellWidth: 25 },
            }
        });

        // Add summary at the bottom
        const finalY = (doc as any).lastAutoTable.finalY || 28;
        doc.setFontSize(11);
        doc.text(`Total en stock: ${totalItems} unités`, 14, finalY + 10);
        doc.text(`Valeur totale du stock: ${formatCurrency(totalValue)}`, 14, finalY + 16);

        doc.save(`${filename}_${today}.pdf`);
    };

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={exportToExcel} title="Exporter au format Excel">
                <FiDownload /> Excel
            </button>
            <button className="btn btn-ghost btn-sm" onClick={exportToPDF} title="Exporter au format PDF">
                <FiFileText /> PDF
            </button>
        </div>
    );
}
