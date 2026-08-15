import React, { useState } from 'react';
import { List } from '../lib/supabase';
import { Plus, Trash2, ChevronRight, ListChecks, FileText } from 'lucide-react';

interface ListsOverviewProps {
  lists: List[];
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
  onCreateList: (title: string, description: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
}

export const ListsOverview: React.FC<ListsOverviewProps> = ({
  lists,
  selectedListId,
  onSelectList,
  onCreateList,
  onDeleteList,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onCreateList(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    setLoading(false);
    setShowModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Listas de Recordatorios</h1>
          <p className="text-slate-500 text-sm">Organiza tus tareas, componentes y acciones por categorías</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Lista
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ListChecks size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Aún no tienes listas</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Crea tu primera lista para organizar equipajes de viajes, tareas recurrentes o cualquier proyecto.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Crear primera lista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => {
            const isSelected = list.id === selectedListId;
            return (
              <div
                key={list.id}
                onClick={() => onSelectList(list.id)}
                className={`bg-white rounded-2xl p-5 border transition cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-2">
                      <FileText size={20} className="text-blue-500 shrink-0" />
                      {list.title}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro de eliminar la lista "${list.title}"?`)) {
                          onDeleteList(list.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Eliminar lista"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {list.description && (
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                      {list.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Creado: {new Date(list.created_at).toLocaleDateString()}</span>
                  <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ver detalle <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Crear Nueva Lista</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título de la lista *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Equipaje Viaje, Tareas Oficina..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Cosas para llevar a la montaña en invierno o esquí"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Crear Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
