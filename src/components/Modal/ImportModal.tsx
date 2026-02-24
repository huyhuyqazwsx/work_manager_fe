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
            alert(error.response?.data?.message || 'Import failed');
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
            <div className="modal-overlay" onClick={handleClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Import Employees</h2>
                        <button className="modal-close" onClick={handleClose}>×</button>
                    </div>

                    <div className="modal-body">
                        <div className="import-step-wrapper">
                            {/* STEP 1 */}
                            <div>
                                <div className="import-step-title">
                                    <div className="step-badge">1</div>
                                    Prepare data
                                </div>

                                <div className="template-card">
                                    <div
                                        className="template-download"
                                        onClick={handleDownloadTemplate}
                                    >
                                        ⬇ Download Import Template (.xlsx)
                                    </div>

                                    <div className="instructions">
                                        <strong>Instructions</strong>
                                        <ul>
                                            <li>Ensure all required fields marked with * are filled.</li>
                                            <li>Do not modify the header row.</li>
                                            <li>Dates must be DD/MM/YYYY.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2 */}
                            <div>
                                <div className="import-step-title">
                                    <div className="step-badge">2</div>
                                    Upload file
                                </div>

                                {!file ? (
                                    <div
                                        className="upload-zone"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <div className="upload-icon">⬆</div>

                                        <div>Drag & drop Excel file here</div>
                                        <div className="upload-sub">
                                            or click to browse (.xlsx, .csv)
                                        </div>

                                        <input
                                            type="file"
                                            accept=".xlsx,.csv"
                                            onChange={handleFileSelect}
                                            hidden
                                            id="file-input"
                                        />

                                        <label htmlFor="file-input" className="browse-btn">
                                            Browse Files
                                        </label>
                                    </div>
                                ) : (
                                    <div className="file-selected">
                                        <div className="file-info">
                                            <div className="file-name">{file.name}</div>
                                            <div className="file-size">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
                                            </div>
                                        </div>

                                        <button onClick={() => setFile(null)}>Remove</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleValidate}
                            disabled={!file || uploading}
                        >
                            {uploading ? 'Processing...' : 'Import & Process →'}
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