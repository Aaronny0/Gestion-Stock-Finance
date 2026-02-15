'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FiShoppingCart, FiCheck, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Product {
    id: string;
    model: string;
    unit_price: number | null;
    quantity: number;
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
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [selectedProduct, setSelectedProduct] = useState('');
    const [saleQty, setSaleQty] = useState('1');
    const [salePrice, setSalePrice] = useState('');
    const [saleNotes, setSaleNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filter
    const [dateFilter, setDateFilter] = useState('');

    const loadData = useCallback(async () => {
        try {
            const { data: prods } = await supabase
                .from('products')
                .select('*, brands(name)')
                .gt('quantity', 0)
                .order('model');
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

            const { data: salesData } = await query;
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

        // Check stock
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

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
    };

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
            <div className="page-header">
                <div>
                    <h2 className="page-title">Ventes</h2>
                    <p className="page-subtitle">Enregistrez et suivez vos ventes</p>
                </div>
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
                            <label className="form-label">Produit *</label>
                            <select
                                className="form-select"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                required
                            >
                                <option value="">Sélectionner un produit</option>
                                {products.map((p) => (
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
