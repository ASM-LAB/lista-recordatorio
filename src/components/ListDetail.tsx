import React, { useState } from 'react';
import { List, Category, ListItem, ItemType } from '../lib/supabase';
import {
  ArrowLeft,
  Plus,
  Trash2,
  RotateCcw,
  Tag,
  CheckSquare,
  Square,
  Package,
  CheckCircle2,
  X,
  Filter
} from 'lucide-react';

interface ListDetailProps {
  list: List;
  categories: Category[];
  items: ListItem[];
  onBack: () => void;
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onAddItem: (
    type: ItemType,
    title: string,
    appliesToAll: boolean,
    categoryIds: string[]
  ) => Promise<void>;
  onToggleItem: (itemId: string, isCompleted: boolean) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onResetList: () => Promise<void>;
}

export const ListDetail: React.FC<ListDetailProps> = ({
  list,
  categories,
  items,
  onBack,
  onAddCategory,
  onDeleteCategory,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onResetList,
}) => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemType, setItemType] = useState<ItemType>('component');
  const [itemTitle, setItemTitle] = useState('');
  const [itemAppliesToAll, setItemAppliesToAll] = useState(false);
  const [itemCategoryIds, setItemCategoryIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleCategoryFilter = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const clearCategoryFilter = () => {
    setSelectedCategoryIds([]);
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSubmitting(true);
    await onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
    setSubmitting(false);
    setShowCategoryModal(false);
  };

  const openItemModal = (type: ItemType) => {
    setItemType(type);
    setItemTitle('');
    setItemAppliesToAll(false);
    setItemCategoryIds([]);
    setShowItemModal(true);
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;
    setSubmitting(true);
    await onAddItem(
      itemType,
      itemTitle.trim(),
      itemAppliesToAll,
      itemAppliesToAll ? [] : itemCategoryIds
    );
    setItemTitle('');
    setSubmitting(false);
    setShowItemModal(false);
  };

  const filterItems = (type: ItemType) => {
    return items.filter((item) => {
      if (item.type !== type) return false;
      if (selectedCategoryIds.length === 0) return true;
      if (item.applies_to_all) return true;

      const itemCatIds = item.categories?.map((c) => c.id) || [];
      return selectedCategoryIds.some((catId) => itemCatIds.includes(catId));
    });
  };

  const componentItems = filterItems('component');
  const actionItems = filterItems('action');

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 mb-4 transition"
        >
          <ArrowLeft size={18} /> Volver a mis listas
        </button>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{list.title}</h1>
            {list.description && (
              <p className="text-slate-600 text-sm mt-1">{list.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                if (confirm('¿Deseas desmarcar todos los componentes y acciones de esta lista?')) {
                  await onResetList();
                }
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition flex items-center gap-2"
              title="Desmarcar todo"
            >
              <RotateCcw size={16} /> Reiniciar Lista
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
            <Tag size={18} className="text-blue-500" />
            Categorías de la lista
          </div>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"
          >
            <Plus size={14} /> Añadir Categoría
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No has creado categorías todavía. Agrega categorías para filtrar los componentes y acciones (ej: Ski, Verano, Invierno).
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={clearCategoryFilter}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 ${
                  selectedCategoryIds.length === 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Filter size={12} /> Todas las categorías
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleCategoryFilter(cat.id)}
                      className="focus:outline-none"
                    >
                      {cat.name}
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `¿Eliminar categoría "${cat.name}"? Se desvinculará de los elementos.`
                          )
                        ) {
                          await onDeleteCategory(cat.id);
                          setSelectedCategoryIds(
                            selectedCategoryIds.filter((id) => id !== cat.id)
                          );
                        }
                      }}
                      className={`p-0.5 rounded-full transition ${
                        isSelected
                          ? 'hover:bg-blue-700 text-blue-100'
                          : 'hover:bg-slate-300 text-slate-400'
                      }`}
                      title="Eliminar categoría"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Package size={20} className="text-indigo-600" />
                Componentes
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                  {componentItems.length}
                </span>
              </div>
              <button
                onClick={() => openItemModal('component')}
                className="text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1"
              >
                <Plus size={14} /> Añadir Componente
              </button>
            </div>

            {componentItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No hay componentes {selectedCategoryIds.length > 0 ? 'para este filtro' : 'en esta lista'}.
              </div>
            ) : (
              <div className="space-y-2">
                {componentItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={onToggleItem}
                    onDelete={onDeleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <CheckCircle2 size={20} className="text-emerald-600" />
                Acciones
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold">
                  {actionItems.length}
                </span>
              </div>
              <button
                onClick={() => openItemModal('action')}
                className="text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1"
              >
                <Plus size={14} /> Añadir Acción
              </button>
            </div>

            {actionItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No hay acciones {selectedCategoryIds.length > 0 ? 'para este filtro' : 'en esta lista'}.
              </div>
            ) : (
              <div className="space-y-2">
                {actionItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={onToggleItem}
                    onDelete={onDeleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Añadir Nueva Categoría</h2>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ski, Verano, Invierno..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Añadir {itemType === 'component' ? 'Componente' : 'Acción'}
            </h2>
            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {itemType === 'component' ? 'Nombre del componente' : 'Descripción de la acción'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    itemType === 'component'
                      ? 'Ej: Jersey, Esquís, Gafas de sol...'
                      : 'Ej: Sacar tarjeta de embarque, Comprobar seguro...'
                  }
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Asociar Categorías
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemAppliesToAll}
                      onChange={(e) => setItemAppliesToAll(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-blue-600">
                      Aplica a todas las categorías
                    </span>
                  </label>
                </div>

                {!itemAppliesToAll && (
                  <div className="border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
                    {categories.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No hay categorías creadas aún en esta lista.
                      </p>
                    ) : (
                      categories.map((cat) => {
                        const isChecked = itemCategoryIds.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setItemCategoryIds([...itemCategoryIds, cat.id]);
                                } else {
                                  setItemCategoryIds(
                                    itemCategoryIds.filter((id) => id !== cat.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{cat.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface ItemRowProps {
  item: ListItem;
  onToggle: (id: string, isCompleted: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onToggle, onDelete }) => {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border transition ${
        item.is_completed
          ? 'bg-slate-50 border-slate-200 opacity-75'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
        <button
          onClick={() => onToggle(item.id, !item.is_completed)}
          className="text-slate-400 hover:text-blue-600 transition shrink-0 focus:outline-none"
        >
          {item.is_completed ? (
            <CheckSquare size={20} className="text-blue-600" />
          ) : (
            <Square size={20} />
          )}
        </button>
        <div className="min-w-0">
          <p
            className={`text-sm font-medium transition break-words ${
              item.is_completed
                ? 'line-through text-slate-400'
                : 'text-slate-800'
            }`}
          >
            {item.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {item.applies_to_all ? (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                Todas las categorías
              </span>
            ) : item.categories && item.categories.length > 0 ? (
              item.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                >
                  {cat.name}
                </span>
              ))
            ) : null}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0"
        title="Eliminar elemento"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
