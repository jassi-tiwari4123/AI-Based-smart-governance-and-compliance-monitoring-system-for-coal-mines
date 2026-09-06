import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FileText, Upload, CheckCircle2, Search, FileCheck } from 'lucide-react';

const DocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [uploadForm, setUploadForm] = useState({
    mineId: 'MINE-007',
    documentType: 'DGMS Safety Certificate',
    file: null
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/documents');
      setDocuments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    const data = new FormData();
    data.append('file', uploadForm.file);
    data.append('mineId', uploadForm.mineId);
    data.append('documentType', uploadForm.documentType);

    try {
      await API.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err) {
      console.error("Upload error", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Statutory Documents Repository...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Statutory Documents & OCR Extraction Engine</h1>
          <p className="text-xs text-gray-600">Digital Archive of DGMS Permits, Environmental Clearances & OCR Verification</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded shadow transition flex items-center space-x-1.5 self-start"
        >
          <Upload className="w-4 h-4" />
          <span>+ Upload Document (Run OCR)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b font-bold text-xs uppercase text-gray-900">
            Document Archive ({documents.length})
          </div>
          <div className="divide-y divide-gray-200 text-xs">
            {documents.length === 0 ? (
              <div className="p-6 text-center text-gray-500 font-semibold">No statutory documents uploaded yet. Upload a document to trigger OCR.</div>
            ) : (
              documents.map((d) => (
                <div
                  key={d.documentId}
                  onClick={() => setSelectedDoc(d)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition ${
                    selectedDoc?.documentId === d.documentId ? 'bg-orange-50 border-l-4 border-[#F47C20]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 block">{d.fileName}</span>
                      <span className="text-gray-500 text-[11px] block">Mine: {d.mineId} | Type: {d.documentType}</span>
                      <span className="text-[10px] text-emerald-700 font-bold block mt-1">✓ OCR Verification: {d.verificationStatus}</span>
                    </div>
                  </div>
                  <span className="text-amber-600 font-bold text-xs">Inspect OCR →</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* OCR Inspection Panel */}
        <div className="bg-white border border-gray-300 rounded-md p-4 space-y-4 shadow-sm">
          <h3 className="text-xs font-extrabold uppercase text-gray-900 border-b pb-2 flex items-center space-x-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Extracted OCR Metadata & Verification</span>
          </h3>

          {selectedDoc ? (
            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-[11px] space-y-1">
                <span className="font-bold text-gray-800 block mb-1">OCR Raw Text Output:</span>
                <p className="whitespace-pre-line text-gray-700">{selectedDoc.ocrText}</p>
              </div>

              {selectedDoc.extractedMetadata && (
                <div className="bg-emerald-50 p-3 rounded border border-emerald-200 text-[11px] space-y-1 text-emerald-900">
                  <span className="font-bold block text-emerald-950">Structured Metadata Extracted:</span>
                  <div>Authority: <strong>{selectedDoc.extractedMetadata.issuingAuthority}</strong></div>
                  <div>Code: <strong>{selectedDoc.extractedMetadata.complianceCode}</strong></div>
                  <div>Confidence: <strong>{selectedDoc.extractedMetadata.confidenceScore * 100}%</strong></div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-8">Select a document from the left list to inspect extracted OCR text.</div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-gray-900 border-b pb-2">
              Upload Statutory Document for OCR Processing
            </h3>
            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mine Location</label>
                <input
                  type="text"
                  value={uploadForm.mineId}
                  onChange={(e) => setUploadForm({ ...uploadForm, mineId: e.target.value })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Document Category</label>
                <select
                  value={uploadForm.documentType}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                  className="w-full p-2 border rounded font-bold bg-gray-50"
                >
                  <option value="DGMS Safety Certificate">DGMS Safety Certificate</option>
                  <option value="Environmental Clearance">Environmental Clearance</option>
                  <option value="Labour Health Audit">Labour Health Audit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Select File (.pdf, .png, .jpg)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 text-gray-600 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#F47C20] text-slate-950 font-extrabold rounded hover:bg-orange-600"
                >
                  Upload & Run OCR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
