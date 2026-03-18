import { useAllOTConfigs } from "../../../../features/policy/hooks/usePolicyQueries";

export default function OTPolicyTab() {
    const { data: configs, isLoading } = useAllOTConfigs();

    if (isLoading) return <div className="p-4">Loading...</div>;

    return (
        <div className="policy-tab-container">
            <div className="tab-header">
                <h3>Overtime Configurations</h3>
                <p>Manage global overtime rules and limits.</p>
            </div>

            <div className="table-wrapper mt-4">
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th>ID Setup</th>
                            <th>Max Hours / Day</th>
                            <th>Max Hours / Month</th>
                            <th>Max Hours / Year</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs?.map((config) => (
                            <tr key={config.id}>
                                <td><span className="text-gray-500 font-mono text-xs">{config.id.substring(0, 8)}...</span></td>
                                <td>{config.maxHoursPerDay}h</td>
                                <td>{config.maxHoursPerMonth}h</td>
                                <td>{config.maxHoursPerYear}h</td>
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
                                <td colSpan={6} className="text-center py-8 text-gray-500">No OT configurations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
