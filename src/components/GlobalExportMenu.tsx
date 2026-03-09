'use client';

import { useState, useRef, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiDownload, FiFileText, FiLoader } from 'react-icons/fi';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function GlobalExportMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStockData = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*, brands(name)')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur lors de la récupération des données', error);
            showToast('Erreur lors de la récupération des données', 'error');
            return null;
        }
        return data;
    };

    const sanitizeText = (text: string | number | null | undefined): string => {
        if (text === null || text === undefined) return '—';
        const str = String(text);
        // Prévention contre l'injection de formules tableur (CSV/Excel) et assainissement basique
        // Empêche l'exécution si la chaîne commence par =, +, -, ou @
        if (/^[=+\-@]/.test(str)) {
            return "'" + str;
        }
        return str;
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        const data = await fetchStockData();
        if (!data) {
            setIsExporting(false);
            return;
        }

        const today = format(new Date(), 'dd-MM-yyyy_HH-mm');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Système';
        workbook.created = new Date();
        
        const worksheet = workbook.addWorksheet('Inventaire');

        // Style de base de la page
        worksheet.properties.defaultRowHeight = 22;

        // En-tête du document
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'INVENTAIRE COMPLET DU STOCK';
        titleCell.font = { name: 'Arial', family: 4, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 40;

        worksheet.mergeCells('A2:F2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Généré le : ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`;
        dateCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF4B5563' } };
        dateCell.alignment = { vertical: 'middle', horizontal: 'right' };

        worksheet.addRow([]); // Blank row

        // Headers
        const headers = ["Marque", "Modèle", "Quantité", "Prix Unitaire", "Valeur Totale", "Dernière MAJ"];
        const headerRow = worksheet.addRow(headers);
        headerRow.height = 25;
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark Gray
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
        });

        let totalValue = 0;
        let totalItems = 0;

        data.forEach((p, index) => {
            if (p.unit_price) totalValue += p.unit_price * p.quantity;
            totalItems += p.quantity;

            const row = worksheet.addRow([
                sanitizeText(p.brands?.name),
                sanitizeText(p.model),
                p.quantity,
                p.unit_price ? p.unit_price : '—',
                p.unit_price ? (p.unit_price * p.quantity) : '—',
                format(new Date(p.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })
            ]);

            const isEven = index % 2 === 0;
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Arial', size: 10 };
                cell.alignment = { vertical: 'middle', horizontal: (colNumber >= 3 && colNumber <= 5) ? 'right' : (colNumber === 6 ? 'center' : 'left') };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
                if (!isEven) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                }
                if ((colNumber === 4 || colNumber === 5) && typeof cell.value === 'number') {
                    cell.numFmt = '#,##0" FCFA"';
                }
            });
        });

        // Totals
        const summaryRow = worksheet.addRow(['TOTAL', '', totalItems, '', totalValue, '']);
        summaryRow.height = 30;
        worksheet.mergeCells(`A${summaryRow.number}:B${summaryRow.number}`);
        
        summaryRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF111827' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'right' : (colNumber === 3 || colNumber === 5 ? 'right' : 'center') };
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF9CA3AF' } },
                bottom: { style: 'medium', color: { argb: 'FF9CA3AF' } }
            };
            if ((colNumber === 4 || colNumber === 5) && typeof cell.value === 'number') {
                cell.numFmt = '#,##0" FCFA"';
            }
        });

        worksheet.columns = [
            { width: 22 }, // Marque
            { width: 35 }, // Modèle
            { width: 12 }, // Qté
            { width: 22 }, // Prix Unitaire
            { width: 22 }, // Valeur Totale
            { width: 20 }  // MAJ
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer as BlobPart]), `Inventaire_Stock_Complet_${today}.xlsx`);
        
        setIsExporting(false);
        setIsOpen(false);
        showToast('Export Excel réussi', 'success');
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        const data = await fetchStockData();
        if (!data) {
            setIsExporting(false);
            return;
        }

        const today = format(new Date(), 'dd-MM-yyyy_HH-mm');
        const doc = new jsPDF();
        
        // Configuration de la police standard (Helvetica) qui supporte bien les caractères Latin-1 (accents français, etc.)
        doc.setFont('helvetica');
        
        doc.setFontSize(16);
        doc.text(`Inventaire Complet du Stock`, 14, 15);
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
                sanitizeText(p.brands?.name),
                sanitizeText(p.model),
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
            headStyles: { fillColor: [99, 102, 241], font: 'helvetica' },
            bodyStyles: { font: 'helvetica' },
            styles: { fontSize: 9, font: 'helvetica' },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' },
                5: { cellWidth: 25 },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 28;
        doc.setFontSize(11);
        doc.text(`Total en stock: ${totalItems} unités`, 14, finalY + 10);
        doc.text(`Valeur totale du stock: ${formatCurrency(totalValue)}`, 14, finalY + 16);

        doc.save(`Inventaire_Stock_Complet_${today}.pdf`);
        
        setIsExporting(false);
        setIsOpen(false);
        showToast('Export PDF réussi', 'success');
    };

    return (
        <div style={{ position: 'relative' }} ref={menuRef}>
            <button
                className="btn btn-ghost"
                onClick={() => setIsOpen(!isOpen)}
                style={{ padding: '8px', borderRadius: '50%' }}
                title="Télécharger l'inventaire complet"
                disabled={isExporting}
            >
                {isExporting ? <FiLoader className="loading-spinner" /> : <FiDownload />}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    width: '180px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <button
                        onClick={handleExportExcel}
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 0, borderBottom: '1px solid var(--border)' }}
                    >
                        <FiDownload style={{ marginRight: '8px' }} /> Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 0 }}
                    >
                        <FiFileText style={{ marginRight: '8px' }} /> PDF
                    </button>
                </div>
            )}
        </div>
    );
}
