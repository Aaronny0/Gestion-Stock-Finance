'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { logAudit } from '@/lib/audit';
import { useToast } from '@/components/Toast';
import { FiPlus, FiSearch, FiEdit2, FiCheck, FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarques } from '@/hooks/useMarques';
import useSWR from 'swr';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface Product {
    id: string;
    brand_id: string;
    model: string;
    unit_price: number | null;
    quantity: number;
    created_at: string;
    updated_at: string;
    brands?: { name: string };
    description?: string;
    active?: boolean;
}

export default function StockPage() {
    const { showToast } = useToast();
    const { marques, loading: marquesLoading } = useMarques();
    const [showForm, setShowForm] = useState(false);
    const [filterBrand, setFilterBrand] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStockData = async (key: string, brandId: string) => {
        let query = supabase
            .from('products')
            .select('*, brands(name)')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (brandId) {
            query = query.eq('brand_id', brandId);
        }

        const { data: productsData, error } = await query;
        if (error) throw error;
        return (productsData as Product[]) || [];
    };

    const { data: products = [], isLoading: loading, mutate } = useSWR(
        ['stockData', filterBrand],
        ([key, brand]) => fetchStockData(key, brand)
    );

    // Form state
    const [formBrand, setFormBrand] = useState('');
    const [formModel, setFormModel] = useState('');
    const [formQuantity, setFormQuantity] = useState('1');
    const [formPrice, setFormPrice] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Inline edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editQty, setEditQty] = useState('');

    // Delete modal
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Deleted loadData, managed by SWR mutate()

    async function handleAddProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!formBrand || !formModel || !formQuantity || !formDescription.trim()) {
            showToast('Veuillez remplir tous les champs obligatoires (incluant la Description)', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { data: existing } = await supabase
                .from('products')
                .select('id, active')
                .eq('brand_id', formBrand)
                .ilike('model', formModel.trim())
                .single();

            if (existing) {
                if (existing.active === false) {
                    await supabase.from('products').update({ active: true }).eq('id', existing.id);
                }
                await supabase.from('stock_entries').insert({
                    product_id: existing.id,
                    quantity: parseInt(formQuantity),
                    unit_price: formPrice ? parseFloat(formPrice) : null,
                });
                showToast('Stock mis à jour avec succès !', 'success');
            } else {
                const { data: newProduct, error: createErr } = await supabase
                    .from('products')
                    .insert({
                        brand_id: formBrand,
                        model: formModel.trim(),
                        quantity: 0,
                        unit_price: formPrice ? parseFloat(formPrice) : null,
                        description: formDescription || null,
                    })
                    .select()
                    .single();

                if (createErr) throw createErr;

                if (newProduct) {
                    await supabase.from('stock_entries').insert({
                        product_id: newProduct.id,
                        quantity: parseInt(formQuantity),
                        unit_price: formPrice ? parseFloat(formPrice) : null,
                    });
                }
                showToast('Produit ajouté avec succès !', 'success');
            }

            setFormBrand('');
            setFormModel('');
            setFormQuantity('1');
            setFormPrice('');
            setFormDescription('');
            setShowForm(false);
            mutate();
        } catch (error) {
            console.error('Add product error:', error);
            showToast('Erreur lors de l\'ajout', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    function startEdit(product: Product) {
        setEditingId(product.id);
        setEditPrice(product.unit_price?.toString() || '');
        setEditQty(product.quantity.toString());
    }

    async function saveEdit(productId: string) {
        try {
            const product = products.find(p => p.id === productId);
            const oldValues = {
                quantity: product?.quantity,
                unit_price: product?.unit_price,
            };

            const updates: Record<string, unknown> = {};
            if (editQty) updates.quantity = parseInt(editQty);
            if (editPrice) updates.unit_price = parseFloat(editPrice);
            else updates.unit_price = null;

            await supabase
                .from('products')
                .update(updates)
                .eq('id', productId);

            // Audit log
            await logAudit('UPDATE', 'product', productId, {
                old: oldValues,
                new: updates,
                model: product?.model,
                brand: product?.brands?.name,
            });

            showToast('Produit mis à jour !', 'success');
            setEditingId(null);
            mutate();
        } catch (error) {
            console.error('Edit error:', error);
            showToast('Erreur lors de la mise à jour', 'error');
        }
    }

    async function confirmDelete() {
        if (!deleteProduct) return;
        setDeleting(true);
        try {
            // Toujours faire un soft-delete (archivage) pour préserver l'intégrité
            const { error: updateError } = await supabase
                .from('products')
                .update({ active: false, quantity: 0 })
                .eq('id', deleteProduct.id);

            if (updateError) throw updateError;

            // Audit log
            await logAudit('ARCHIVE', 'product', deleteProduct.id, {
                model: deleteProduct.model,
                brand: deleteProduct.brands?.name,
                previous_quantity: deleteProduct.quantity,
                previous_price: deleteProduct.unit_price,
            });

            showToast(
                `"${deleteProduct.brands?.name} ${deleteProduct.model}" supprimé du stock avec succès.`,
                'success'
            );
            mutate();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Erreur lors de la suppression', 'error');
        } finally {
            setDeleting(false);
            setDeleteProduct(null);
        }
    }

    const filteredProducts = products.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.model.toLowerCase().includes(q) ||
            p.brands?.name.toLowerCase().includes(q)
        );
    });

    if (loading && products.length === 0) {
        return (
            <div className="animate-in">
                <div className="page-header">
                    <div>
                        <h2 className="page-title">Stock &amp; Inventaire</h2>
                        <p className="page-subtitle">Gérez vos produits et entrées de stock</p>
                    </div>
                </div>
                <div className="table-container">
                    <TableSkeleton rows={8} columns={7} />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            {/* ── Delete Confirmation Modal ── */}
            {deleteProduct && (
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
                        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>
                            <FiAlertTriangle style={{ color: 'var(--danger)', width: 40, height: 40 }} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', textAlign: 'center' }}>
                            Supprimer ce produit ?
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '4px', fontSize: '14px' }}>
                            Le produit sera retiré de votre stock et inventaire.
                        </p>
                        <div style={{
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px 16px',
                            margin: '16px 0 24px',
                            textAlign: 'center',
                        }}>
                            <span className="badge badge-purple" style={{ marginRight: '8px' }}>
                                {deleteProduct.brands?.name}
                            </span>
                            <strong style={{ color: 'var(--text-primary)' }}>
                                {deleteProduct.model}
                            </strong>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                Stock actuel : {deleteProduct.quantity} unité{deleteProduct.quantity > 1 ? 's' : ''}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="btn btn-danger"
                                style={{ flex: 1 }}
                            >
                                {deleting ? <span className="loading-spinner" /> : <FiTrash2 />}
                                Supprimer
                            </button>
                            <button
                                onClick={() => setDeleteProduct(null)}
                                className="btn btn-ghost"
                                disabled={deleting}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Stock &amp; Inventaire</h2>
                    <p className="page-subtitle">Gérez vos produits et entrées de stock</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        <FiPlus /> Ajouter un Produit
                    </button>
                </div>
            </div>

            {/* Add Product Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '24px', animation: 'scaleIn 0.2s ease' }}>
                    <div className="card-title" style={{ marginBottom: '16px' }}>
                        Nouveau Produit / Entrée de Stock
                    </div>
                    <form onSubmit={handleAddProduct}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Marque *</label>
                                <select
                                    className="form-select"
                                    value={formBrand}
                                    onChange={(e) => setFormBrand(e.target.value)}
                                    required
                                    disabled={marquesLoading}
                                >
                                    <option value="">
                                        {marquesLoading ? 'Chargement...' : 'Sélectionner une marque'}
                                    </option>
                                    {marques.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Modèle *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: Hot 40i"
                                    value={formModel}
                                    onChange={(e) => setFormModel(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantité *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={formQuantity}
                                    onChange={(e) => setFormQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prix Unitaire</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Optionnel"
                                    value={formPrice}
                                    onChange={(e) => setFormPrice(e.target.value)}
                                />
                                <span className="form-hint">Le prix peut être renseigné plus tard</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description (Obligatoire)</label>
                            <textarea
                                className="form-input"
                                placeholder="Détails sur l'état, couleur, stockage..."
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                style={{ minHeight: '80px', resize: 'vertical' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button type="submit" className="btn btn-success" disabled={submitting}>
                                {submitting ? <span className="loading-spinner" /> : <FiCheck />}
                                Valider
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="filter-bar">
                <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Rechercher un produit..."
                        style={{ paddingLeft: '36px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="form-select"
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    style={{ width: 'auto', minWidth: '180px' }}
                    disabled={marquesLoading}
                >
                    <option value="">{marquesLoading ? 'Chargement...' : 'Toutes les marques'}</option>
                    {marques.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Marque</th>
                            <th>Modèle</th>
                            <th>Description</th>
                            <th>Quantité</th>
                            <th>Prix Unitaire</th>
                            <th>Valeur Stock</th>
                            <th>Dernière MAJ</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📦</div>
                                        <div className="empty-state-text">Aucun produit en stock</div>
                                        <div className="empty-state-sub">Ajoutez votre premier produit ci-dessus</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <span className="badge badge-purple">{p.brands?.name}</span>
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {p.model}
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                                        {p.description || '—'}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ width: '80px', padding: '4px 8px' }}
                                                value={editQty}
                                                onChange={(e) => setEditQty(e.target.value)}
                                                min="0"
                                            />
                                        ) : (
                                            <span className={`badge ${p.quantity > 5 ? 'badge-success' : p.quantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                                {p.quantity}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ width: '120px', padding: '4px 8px' }}
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                placeholder="Optionnel"
                                            />
                                        ) : (
                                            formatCurrency(p.unit_price)
                                        )}
                                    </td>
                                    <td>
                                        {p.unit_price
                                            ? formatCurrency(p.unit_price * p.quantity)
                                            : '—'
                                        }
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                        {format(new Date(p.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn btn-success btn-sm" onClick={() => saveEdit(p.id)}>
                                                    <FiCheck />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                                                    <FiX />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                                                    <FiEdit2 /> Modifier
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => setDeleteProduct(p)}
                                                    style={{
                                                        background: 'rgba(239,68,68,0.1)',
                                                        color: 'var(--danger)',
                                                        border: '1px solid rgba(239,68,68,0.25)',
                                                    }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                                {/* Point 7 : alerte ⚠️ après le bouton supprimer si stock = 0 */}
                                                {p.quantity === 0 && (
                                                    <span title="Stock épuisé : Réapprovisionnement nécessaire" className="blink-alert" style={{ fontSize: '18px', marginLeft: '6px' }}>⚠️</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            {filteredProducts.length > 0 && (
                <div style={{
                    display: 'flex', gap: '24px', justifyContent: 'flex-end',
                    marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)'
                }}>
                    <span>
                        <strong>{filteredProducts.length}</strong> produit{filteredProducts.length > 1 ? 's' : ''}
                    </span>
                    <span>
                        Total en stock : <strong>{filteredProducts.reduce((s, p) => s + p.quantity, 0)}</strong> unités
                    </span>
                    <span>
                        Valeur totale : <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(filteredProducts.reduce((s, p) => s + ((p.unit_price || 0) * p.quantity), 0))}</strong>
                    </span>
                </div>
            )}
        </div>
    );
}