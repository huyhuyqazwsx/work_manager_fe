import { useAllLeaveConfigs } from "../../../../features/policy/hooks/usePolicyQueries";

export default function LeavePolicyTab() {
    const { data: configs, isLoading } = useAllLeaveConfigs();

    if (isLoading) return <div className="p-4">Loading...</div>;

    return (
        <div className="policy-tab-container">
            <div className="tab-header">
                <h3>Leave Configurations</h3>
                <p>Manage leave policies for different contract types.</p>
            </div>

            <div className="table-wrapper mt-4">
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th>Contract Type</th>
                            <th>Base Days / Year</th>
                            <th>Max Days / Request</th>
                            <th>Prorate By Month</th>
                            <th>Negative Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs?.map((config) => (
                            <tr key={config.id}>
                                <td><span className="font-medium">{config.contractType}</span></td>
                                <td>{config.baseDaysPerYear}</td>
                                <td>{config.maxDaysPerRequest}</td>
                                <td>{config.prorateByMonth ? "Yes" : "No"}</td>
                                <td>{config.allowNegativeBalance ? "Yes" : "No"}</td>
                                <td>
                                    <span className={`status-badge ${config.isActive ? 'active' : 'inactive'}`}>
                                        {config.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td>
                                    <button className="text-primary hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                        {(!configs || configs.length === 0) && (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">No leave configurations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
