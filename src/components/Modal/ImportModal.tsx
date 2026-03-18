import { parseBackendError } from "../../utils/error.utils";
import { useState, useEffect } from "react";
import "./ImportModal.css";
import { inviteApi } from "../../features/invite/api/inviteApi.ts";
import type { InviteImportResponse } from "../../types/invite.type.ts";
import ImportResultModal from "./ImportResultModal.tsx";

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [validationResult, setValidationResult] = useState<InviteImportResponse | null>(null);
    const [showResult, setShowResult] = useState(false);

    // ✅ Reset state khi modal đóng
    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setUploading(false);
            setValidationResult(null);
            setShowResult(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDownloadTemplate = async () => {
        try {
            const blob = await inviteApi.downloadTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Invite_Template.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to download template');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
            setFile(droppedFile);
        }
    };

    const handleValidate = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const result = await inviteApi.importFromExcel(file);
            setValidationResult(result);
            setShowResult(true); // ✅ Hiện Result Modal
            // ❌ KHÔNG đóng Import Modal ở đây
            onSuccess(); // ✅ Refresh danh sách ngay
        } catch (error: any) {
            alert(parseBackendError(error, 'Import failed'));
        } finally {
            setUploading(false);
        }
    };

    const handleRetry = () => {
        // ✅ Đóng Result Modal, reset để upload lại
        setShowResult(false);
        setFile(null);
        setValidationResult(null);
        // Import Modal vẫn mở
    };

    const handleClose = () => {
        onClose(); // ✅ Đóng Import Modal
    };

    const handleResultClose = () => {
        // ✅ Đóng Result Modal
        setShowResult(false);
        setValidationResult(null);
        // ✅ Đóng Import Modal luôn
        onClose();
    };

    return (
        <>
            {/* IMPORT MODAL */}
            <div className="import-modal-overlay" onClick={handleClose}>
                <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="import-modal-header">
                        <h2>Import Employees</h2>
                        <button className="import-modal-close" onClick={handleClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="import-modal-body">
                        <div className="import-step-wrapper">
                            {/* STEP 1 */}
                            <div>
                                <div className="import-step-title">
                                    <div className="step-badge step-badge-light">1</div>
                                    Prepare data
                                </div>

                                <div className="template-card">
                                    <div className="template-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    </div>
                                    <div
                                        className="template-download"
                                        onClick={handleDownloadTemplate}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        Download Import Template (.xlsx)
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2 */}
                            <div>
                                <div className="import-step-title" style={{ marginTop: 10 }}>
                                    <div className="step-badge step-badge-dark">2</div>
                                    Upload file
                                </div>

                                {!file ? (
                                    <div
                                        className="upload-zone"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                        onClick={() => document.getElementById("file-input")?.click()}
                                    >
                                        <div className="upload-icon-circle">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5 .7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2A7.5 7.5 0 0 0 2 11.5v.5A4.8 4.8 0 0 0 6 17h11"></path><polyline points="16 10 12 6 8 10"></polyline><line x1="12" y1="6" x2="12" y2="15"></line></svg>
                                        </div>

                                        <div className="upload-text">
                                            Drag & drop your Excel file here
                                        </div>
                                        <div className="upload-sub">
                                            or <span className="upload-browse-link">click to browse</span>
                                        </div>
                                        <div className="upload-supported">
                                            Supported: .xlsx, .csv
                                        </div>

                                        <input
                                            type="file"
                                            accept=".xlsx,.csv"
                                            onChange={handleFileSelect}
                                            hidden
                                            id="file-input"
                                        />
                                    </div>
                                ) : (
                                    <div className="file-selected">
                                        <div className="file-info-col">
                                            <div className="file-selected-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                            </div>
                                            <div className="file-info">
                                                <div className="file-name">{file.name}</div>
                                                <div className="file-meta">
                                                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    <span className="file-ready">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        Ready for import
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="file-remove-btn" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="import-modal-footer">
                        <button className="import-btn-cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            className="import-btn-primary"
                            onClick={handleValidate}
                            disabled={!file || uploading}
                        >
                            {uploading ? 'Processing...' : 'Continue to Validation →'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RESULT MODAL - Luôn render nếu có result */}
            {validationResult && (
                <ImportResultModal
                    isOpen={showResult}
                    result={validationResult}
                    onClose={handleResultClose}
                    onRetry={handleRetry}
                />
            )}
        </>
    );
}