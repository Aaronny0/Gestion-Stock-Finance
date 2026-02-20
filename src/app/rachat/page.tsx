'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FiShoppingBag, FiCheck, FiPackage } from 'react-icons/fi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarques } from '@/hooks/useMarques';

interface Buyback {
    id: string;
    client_name: string | null;
    brand_name: string;
    model: string;
    description: string | null;
    purchase_price: number;
    notes: string | null;
    created_at: string;
}

export default function RachatPage() {
    const { showToast } = useToast();
    const { marques, loading: marquesLoading } = useMarques();
    const [buybacks, setBuybacks] = useState<Buyback[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [clientName, setClientName] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [description, setDescription] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [notes, setNotes] = useState('');

    const loadData = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('buybacks')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            setBuybacks(data || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

    async function handleBuyback(e: React.FormEvent) {
        e.preventDefault();
        if (!brand || !model || !purchasePrice) {
            showToast('Marque, modèle et prix d\'achat sont obligatoires', 'error');
            return;
        }

        const price = parseFloat(purchasePrice);
        if (isNaN(price) || price <= 0) {
            showToast('Prix d\'achat invalide', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Enregistrer le rachat dans la table buybacks
            const { error: buybackError } = await supabase.from('buybacks').insert({
                client_name: clientName.trim() || null,
                brand_name: brand,
                model: model.trim(),
                description: description.trim() || null,
                purchase_price: price,
                notes: notes.trim() || null,
            });

            if (buybackError) throw buybackError;

            // 2. Ajouter au stock automatiquement
            // Trouver la marque par nom
            const { data: brandData } = await supabase
                .from('brands')
                .select('id')
                .ilike('name', brand)
                .single();

            if (brandData?.id) {
                // Trouver ou créer le produit
                const { data: existingProduct } = await supabase
                    .from('products')
                    .select('id')
                    .eq('brand_id', brandData.id)
                    .ilike('model', model.trim())
                    .single();

                let productId = existingProduct?.id;

                if (!productId) {
                    const { data: newProduct } = await supabase
                        .from('products')
                        .insert({
                            brand_id: brandData.id,
                            model: model.trim(),
                            quantity: 0,
                            unit_price: price,
                            description: description.trim() || `Racheté le ${new Date().toLocaleDateString('fr-FR')}`,
                        })
                        .select('id')
                        .single();
                    productId = newProduct?.id;
                }

                if (productId) {
                    await supabase.from('stock_entries').insert({
                        product_id: productId,
                        quantity: 1,
                        unit_price: price,
                        notes: `Rachat client${clientName ? ` — ${clientName}` : ''}`,
                    });
                }
            }

            showToast('Rachat enregistré et téléphone ajouté au stock !', 'success');
            setClientName('');
            setBrand('');
            setModel('');
            setDescription('');
            setPurchasePrice('');
            setNotes('');
            loadData();
        } catch (error: unknown) {
            console.error('Buyback error:', error);
            showToast(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    const totalSpent = buybacks.reduce((s, b) => s + Number(b.purchase_price), 0);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span>Chargement des rachats...</span>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Rachat de Téléphones</h2>
                    <p className="page-subtitle">Achetez des téléphones auprès de vos clients — ajout automatique au stock</p>
                </div>
            </div>

            {/* Info banner */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                marginBottom: '20px', fontSize: '13px', color: 'var(--success)',
            }}>
                <FiPackage />
                <span>Chaque téléphone racheté est automatiquement ajouté à votre stock & inventaire.</span>
            </div>

            <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
                {/* ── Formulaire de Rachat ── */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiShoppingBag /> Nouveau Rachat
                        </div>
                    </div>

                    <form onSubmit={handleBuyback}>
                        <div className="form-group">
                            <label className="form-label">Nom du Client (Optionnel)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ex: Jean Dupont"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Marque *</label>
                                <select
                                    className="form-select"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    required
                                    disabled={marquesLoading}
                                >
                                    <option value="">
                                        {marquesLoading ? 'Chargement...' : 'Sélectionner'}
                                    </option>
                                    {marques.map((m) => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Modèle *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: Galaxy A54"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description / État</label>
                            <textarea
                                className="form-input"
                                placeholder="État général, couleur, stockage, rayures..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Prix d'Achat (payé au client) *</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="FCFA"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                                required
                                min="0"
                            />
                        </div>

                        {purchasePrice && parseFloat(purchasePrice) > 0 && (
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '12px 16px',
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Montant décaissé</span>
                                <span style={{
                                    fontFamily: 'Outfit',
                                    fontSize: '20px',
                                    fontWeight: 800,
                                    color: 'var(--danger)',
                                }}>
                                    — {formatCurrency(parseFloat(purchasePrice))}
                                </span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Notes optionnelles..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={submitting}
                        >
                            {submitting ? <span className="loading-spinner" /> : <FiCheck />}
                            Enregistrer le Rachat
                        </button>
                    </form>
                </div>

                {/* ── Résumé ── */}
                <div>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div className="stat-label">Total décaissé (rachats affichés)</div>
                        <div className="stat-value" style={{ color: 'var(--danger)', marginTop: '8px' }}>
                            {formatCurrency(totalSpent)}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            {buybacks.length} rachat{buybacks.length > 1 ? 's' : ''} enregistré{buybacks.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="card" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-primary-hover)', marginBottom: '8px' }}>
                                ℹ️ Comment ça marche ?
                            </div>
                            <ol style={{ paddingLeft: '16px', margin: 0 }}>
                                <li>Saisissez les infos du téléphone et le prix payé au client</li>
                                <li>Le téléphone est automatiquement ajouté à votre <strong>Stock & Inventaire</strong></li>
                                <li>Revenez sur la page Stock pour modifier le prix de revente</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Historique ── */}
            <div className="section" style={{ marginTop: '32px' }}>
                <h3 className="section-title">Historique des Rachats</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Téléphone</th>
                                <th>Description / État</th>
                                <th>Prix Payé</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buybacks.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📱</div>
                                            <div className="empty-state-text">Aucun rachat enregistré</div>
                                            <div className="empty-state-sub">Enregistrez votre premier achat ci-dessus</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                buybacks.map((b) => (
                                    <tr key={b.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                            {format(new Date(b.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {b.client_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td>
                                            <span className="badge badge-purple" style={{ marginRight: '6px' }}>
                                                {b.brand_name}
                                            </span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {b.model}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                                            {b.description || '—'}
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                                            {formatCurrency(Number(b.purchase_price))}
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                            {b.notes || '—'}
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
