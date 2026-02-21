'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { FiShoppingCart, FiCheck, FiLock } from 'react-icons/fi';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarques } from '@/hooks/useMarques';

interface Product {
    id: string;
    model: string;
    unit_price: number | null;
    quantity: number;
    brand_id: string;
    brands?: { name: string };
}

interface Sale {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes: string | null;
    created_at: string;
    products?: { model: string; brands?: { name: string } };
}

export default function VentesPage() {
    const { showToast } = useToast();
    const { marques, loading: marquesLoading } = useMarques();
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [saleQty, setSaleQty] = useState('1');
    const [salePrice, setSalePrice] = useState('');
    const [saleNotes, setSaleNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filter
    const [dateFilter, setDateFilter] = useState('');

    // Clôture
    const [showClotureModal, setShowClotureModal] = useState(false);
    const [clotureStats, setClotureStats] = useState<{ sales: number; trades: number; total: number } | null>(null);
    const [cloturing, setCloturing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const { data: prods, error: prodsErr } = await supabase
                .from('products')
                .select('*, brands(name)')
                .gt('quantity', 0)
                .order('model');
            if (prodsErr) throw prodsErr;
            setProducts(prods || []);

            let query = supabase
                .from('sales')
                .select('*, products(model, brands(name))')
                .order('created_at', { ascending: false })
                .limit(50);

            if (dateFilter) {
                query = query.gte('created_at', `${dateFilter}T00:00:00`)
                    .lte('created_at', `${dateFilter}T23:59:59`);
            }

            const { data: salesData, error: salesErr } = await query;
            if (salesErr) throw salesErr;
            setSales(salesData || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    }, [dateFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filtrage par brand_id (utilise UUID, cohérent avec useMarques)
    const filteredProducts = products.filter(p => {
        if (!selectedBrandFilter) return true;
        return p.brand_id === selectedBrandFilter;
    });

    // Auto-fill price when product is selected
    useEffect(() => {
        if (selectedProduct) {
            const product = products.find(p => p.id === selectedProduct);
            if (product?.unit_price) {
                setSalePrice(product.unit_price.toString());
            } else {
                setSalePrice('');
            }
        }
    }, [selectedProduct, products]);

    async function handleSale(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedProduct || !saleQty || !salePrice) {
            showToast('Veuillez remplir tous les champs requis', 'error');
            return;
        }

        const qty = parseInt(saleQty);
        const price = parseFloat(salePrice);

        const product = products.find(p => p.id === selectedProduct);
        if (!product || product.quantity < qty) {
            showToast('Stock insuffisant pour cette vente', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('sales').insert({
                product_id: selectedProduct,
                quantity: qty,
                unit_price: price,
                total_price: qty * price,
                notes: saleNotes || null,
            });

            if (error) throw error;

            showToast('Vente enregistrée avec succès !', 'success');
            setSelectedProduct('');
            setSaleQty('1');
            setSalePrice('');
            setSaleNotes('');
            loadData();
        } catch (error: unknown) {
            console.error('Sale error:', error);
            const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            showToast(`Erreur: ${errMsg}`, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    // ── CLÔTURE ──────────────────────────────────────────────
    async function openCloture() {
        const today = new Date();
        const todayStart = startOfDay(today).toISOString();
        const todayEnd = endOfDay(today).toISOString();

        const { data: todaySales } = await supabase
            .from('sales')
            .select('total_price')
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd);

        const { data: todayTrades } = await supabase
            .from('trades')
            .select('client_complement')
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd);

        const totalVentes = todaySales?.reduce((s, x) => s + Number(x.total_price), 0) || 0;
        const totalTrocs = todayTrades?.reduce((s, x) => s + Number(x.client_complement), 0) || 0;

        setClotureStats({
            sales: todaySales?.length || 0,
            trades: todayTrades?.length || 0,
            total: totalVentes + totalTrocs,
        });
        setShowClotureModal(true);
    }

    async function confirmCloture() {
        if (!clotureStats) return;
        setCloturing(true);
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            const { data: existing } = await supabase
                .from('daily_receipts')
                .select('id')
                .eq('receipt_date', todayStr)
                .single();

            if (existing) {
                await supabase
                    .from('daily_receipts')
                    .update({
                        total_amount: clotureStats.total,
                        notes: `Clôture automatique — ${clotureStats.sales} vente(s), ${clotureStats.trades} troc(s)`,
                    })
                    .eq('id', existing.id);
            } else {
                await supabase.from('daily_receipts').insert({
                    receipt_date: todayStr,
                    total_amount: clotureStats.total,
                    notes: `Clôture automatique — ${clotureStats.sales} vente(s), ${clotureStats.trades} troc(s)`,
                });
            }

            showToast(`Journée du ${format(new Date(), 'dd MMMM yyyy', { locale: fr })} clôturée !`, 'success');
            setShowClotureModal(false);
        } catch (error) {
            console.error('Cloture error:', error);
            showToast('Erreur lors de la clôture', 'error');
        } finally {
            setCloturing(false);
        }
    }
    // ──────────────────────────────────────────────────────────

    // formatCurrency importé depuis @/lib/format

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span>Chargement des ventes...</span>
            </div>
        );
    }

    return (
        <div className="animate-in">
            {/* Modale de Clôture */}
            {showClotureModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.75)',
                    zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>🔒</div>
                        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', textAlign: 'center' }}>
                            Clôturer la journée ?
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
                            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                        </p>

                        {clotureStats && (
                            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Ventes enregistrées</span>
                                    <strong style={{ color: 'var(--success)' }}>{clotureStats.sales}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Trocs enregistrés</span>
                                    <strong style={{ color: 'var(--accent-primary-hover)' }}>{clotureStats.trades}</strong>
                                </div>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    paddingTop: '12px', borderTop: '1px solid var(--border)'
                                }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Recette</span>
                                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--success)' }}>
                                        {formatCurrency(clotureStats.total)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
                            Cette recette sera enregistrée dans Finance. Cette action est réversible.
                        </p>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={confirmCloture}
                                disabled={cloturing}
                                className="btn btn-success"
                                style={{ flex: 1 }}
                            >
                                {cloturing ? <span className="loading-spinner" /> : <FiCheck />}
                                Confirmer la Clôture
                            </button>
                            <button
                                onClick={() => setShowClotureModal(false)}
                                className="btn btn-ghost"
                                disabled={cloturing}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h2 className="page-title">Ventes</h2>
                    <p className="page-subtitle">Enregistrez et suivez vos ventes</p>
                </div>
                {/* Bouton Clôture */}
                <button className="btn btn-ghost" onClick={openCloture} style={{
                    border: '1px solid var(--warning)',
                    color: 'var(--warning)',
                }}>
                    <FiLock /> Clôturer la Journée
                </button>
            </div>

            <div className="grid-2">
                {/* Sale Form */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiShoppingCart /> Nouvelle Vente
                        </div>
                    </div>
                    <form onSubmit={handleSale}>
                        <div className="form-group">
                            <label className="form-label">Filtrer par Marque (Optionnel)</label>
                            <select
                                className="form-select"
                                value={selectedBrandFilter}
                                onChange={(e) => {
                                    setSelectedBrandFilter(e.target.value);
                                    setSelectedProduct('');
                                }}
                                style={{ marginBottom: '12px' }}
                                disabled={marquesLoading}
                            >
                                <option value="">{marquesLoading ? 'Chargement...' : 'Toutes les marques'}</option>
                                {marques.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>

                            <label className="form-label">Produit *</label>
                            <select
                                className="form-select"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                required
                                disabled={filteredProducts.length === 0}
                            >
                                <option value="">
                                    {filteredProducts.length === 0 ? 'Aucun produit disponible' : 'Sélectionner un produit'}
                                </option>
                                {filteredProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.brands?.name} {p.model} (Stock: {p.quantity})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Quantité *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={saleQty}
                                    onChange={(e) => setSaleQty(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prix de Vente (unitaire) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={salePrice}
                                    onChange={(e) => setSalePrice(e.target.value)}
                                    placeholder="FCFA"
                                    required
                                />
                            </div>
                        </div>

                        {selectedProduct && saleQty && salePrice && (
                            <div style={{
                                background: 'var(--accent-primary-glow)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '12px 16px',
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Montant Total</span>
                                <span style={{
                                    fontFamily: 'Outfit',
                                    fontSize: '22px',
                                    fontWeight: 800,
                                    color: 'var(--accent-primary-hover)'
                                }}>
                                    {formatCurrency(parseInt(saleQty) * parseFloat(salePrice))}
                                </span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Notes optionnelles..."
                                value={saleNotes}
                                onChange={(e) => setSaleNotes(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                            {submitting ? <span className="loading-spinner" /> : <FiCheck />}
                            Enregistrer la Vente
                        </button>
                    </form>
                </div>

                {/* Summary Card */}
                <div>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div className="stat-label">Total des ventes affichées</div>
                        <div className="stat-value" style={{ color: 'var(--success)' }}>
                            {formatCurrency(totalRevenue)}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            {sales.length} transaction{sales.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Filtrer par date</div>
                        </div>
                        <input
                            type="date"
                            className="form-input"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                        {dateFilter && (
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ marginTop: '8px' }}
                                onClick={() => setDateFilter('')}
                            >
                                Effacer le filtre
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sales History */}
            <div className="section" style={{ marginTop: '24px' }}>
                <h3 className="section-title">Historique des Ventes</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Produit</th>
                                <th>Qté</th>
                                <th>Prix Unitaire</th>
                                <th>Total</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">🛒</div>
                                            <div className="empty-state-text">Aucune vente enregistrée</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sales.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                            {format(new Date(s.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                        </td>
                                        <td>
                                            <span className="badge badge-purple" style={{ marginRight: '6px' }}>
                                                {s.products?.brands?.name}
                                            </span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {s.products?.model}
                                            </span>
                                        </td>
                                        <td>{s.quantity}</td>
                                        <td>{formatCurrency(Number(s.unit_price))}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            {formatCurrency(Number(s.total_price))}
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                            {s.notes || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
