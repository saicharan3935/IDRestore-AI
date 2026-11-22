import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Trash2,
  FileDown,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import ComparisonSlider from '../components/ComparisonSlider';

export default function DocumentHistory({ initialSearch = '' }) {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory(search, statusFilter, 50, 0);
      setDocuments(res.items || []);
      setTotal(res.total || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Erase this personnel document permanently?')) return;
    try {
      await api.deleteDocument(id);
      loadHistory();
      if (previewDoc?.id === id) setPreviewDoc(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently erase ${selectedIds.length} selected documents?`)) return;
    try {
      await api.bulkDelete(selectedIds);
      loadHistory();
    } catch (err) {
      alert('Bulk delete failed: ' + err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  return (
    <div className="w-full p-6 space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            HISTORICAL DOCUMENT AUDIT
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            Tamper-evident SQLite audit ledger &bull; Retention policy enforced.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#FF5C5C]/20 border border-[#FF5C5C]/40 text-[#FF5C5C] hover:bg-[#FF5C5C]/30 transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-[#101820] border border-[#22323D] text-[#94A3B8] hover:text-[#00E5FF] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#101820] border border-[#22323D]">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B1117] border border-[#22323D] text-xs font-mono text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#00E5FF]"
          />
        </form>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#94A3B8]">STATUS:</span>
          {['ALL', 'COMPLETED', 'REQUIRES_REVIEW', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 font-bold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-[#101820] border border-[#22323D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#22323D] text-[#94A3B8] bg-[#0B1117]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={documents.length > 0 && selectedIds.length === documents.length}
                    onChange={selectAll}
                    className="accent-[#00E5FF]"
                  />
                </th>
                <th className="py-3 px-3">RECORD SPECIFICATION</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3">OPERATIONS APPLIED</th>
                <th className="py-3 px-3">METRICS GAIN</th>
                <th className="py-3 px-3">PROCESSING DURATION</th>
                <th className="py-3 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22323D]/50 text-[#DCE7EC]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#17232C]/40 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="accent-[#00E5FF]"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#F8FAFC] truncate max-w-xs">
                      {doc.original_filename}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {doc.id} &bull; {Math.round(doc.file_size_bytes / 1024)} KB
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.status === 'COMPLETED'
                          ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                          : doc.status === 'REQUIRES_REVIEW'
                          ? 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/30'
                          : 'bg-[#FF5C5C]/15 text-[#FF5C5C]'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-[#94A3B8] max-w-xs truncate">
                    {(doc.operations_applied || []).join(', ') || 'Standard Enhancement'}
                  </td>
                  <td className="py-3 px-3 font-bold text-[#00FFA3]">
                    +{doc.metrics?.sharpness_gain_percent || 0}%
                  </td>
                  <td className="py-3 px-3 text-[#94A3B8]">
                    {doc.metrics?.processing_time_ms || 0} ms
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded bg-[#17232C] hover:bg-[#00E5FF] hover:text-black transition-colors"
                        title="Inspect Comparison"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {doc.report_url && (
                        <a
                          href={doc.report_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-[#17232C] hover:bg-[#00FFA3] hover:text-black transition-colors"
                          title="Download PDF Certificate"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded bg-[#17232C] hover:bg-[#FF5C5C] hover:text-white transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#94A3B8]">
                    {loading ? 'Querying records...' : 'No historical documents matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Modal Popup */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-[#101820] border border-[#00E5FF]/40 rounded-2xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#22323D] mb-4">
              <div>
                <span className="text-xs font-mono text-[#00E5FF] font-bold block">
                  RECORD AUDIT INSPECTION
                </span>
                <span className="text-sm font-bold text-[#F8FAFC]">
                  {previewDoc.original_filename}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-lg bg-[#17232C] hover:bg-[#FF5C5C] text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ComparisonSlider
              originalUrl={previewDoc.original_url}
              restoredUrl={previewDoc.restored_url}
              metrics={previewDoc.metrics}
            />
          </div>
        </div>
      )}
    </div>
  );
}
