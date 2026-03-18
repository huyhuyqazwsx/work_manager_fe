import { useAllPaidPersonalEvents } from "../../../../features/policy/hooks/usePolicyQueries";

export default function PersonalLeaveTab() {
    const { data: events, isLoading } = useAllPaidPersonalEvents();

    if (isLoading) return <div className="p-4">Loading...</div>;

    return (
        <div className="policy-tab-container">
            <div className="tab-header flex justify-between items-center">
                <div>
                    <h3>Paid Personal Leave Events</h3>
                    <p>Manage special leave events with pay (Marriage, Funeral, etc.)</p>
                </div>
                <button className="primary-btn text-sm py-2 px-4">+ Add Event</button>
            </div>

            <div className="table-wrapper mt-4">
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Event Name</th>
                            <th>Allowed Days</th>
                            <th>Reset On Use</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events?.map((event) => (
                            <tr key={event.id}>
                                <td><span className="role-badge blue">{event.code}</span></td>
                                <td className="font-medium">{event.name}</td>
                                <td>{event.allowedDays} days</td>
                                <td>{event.resetOnUse ? "Yes" : "No"}</td>
                                <td>
                                    <button className="text-primary hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                        {(!events || events.length === 0) && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">No personal leave events found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
