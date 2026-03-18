import { useState } from "react";
import "./PolicyConfigPage.css";
import LeavePolicyTab from "./tabs/LeavePolicyTab";
import OTPolicyTab from "./tabs/OTPolicyTab";
import PersonalLeaveTab from "./tabs/PersonalLeaveTab";

type TabType = 'leave' | 'ot' | 'personal';

export default function PolicyConfigPage() {
    const [activeTab, setActiveTab] = useState<TabType>('leave');

    return (
        <div className="policy-config-page">
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <span>Home</span>
                        <span className="separator">/</span>
                        <span className="current">Policy Configuration</span>
                    </div>
                    <h1 className="page-title">Policy Configuration</h1>
                </div>
            </div>

            <div className="policy-tabs">
                <button
                    className={`policy-tab-btn ${activeTab === 'leave' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leave')}
                >
                    Leave Policies
                </button>
                <button
                    className={`policy-tab-btn ${activeTab === 'ot' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ot')}
                >
                    OT Rules
                </button>
                <button
                    className={`policy-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    Paid Personal Leave Events
                </button>
            </div>

            <div className="policy-tab-content">
                {activeTab === 'leave' && <LeavePolicyTab />}
                {activeTab === 'ot' && <OTPolicyTab />}
                {activeTab === 'personal' && <PersonalLeaveTab />}
            </div>
        </div>
    );
}
