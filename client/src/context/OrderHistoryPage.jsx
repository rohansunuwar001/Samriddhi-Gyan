// pages/OrderHistoryPage.js

import { getMyOrderHistory } from '@/features/api/orderApiService';
import { useEffect, useState } from 'react';


const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await getMyOrderHistory();
                setOrders(data);
            } catch (err) {
                setError(err.message || "Failed to load order history.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []); // Empty dependency array means this runs once on component mount

    if (loading) return <div>Loading your order history...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div>
            <h1>My Order History</h1>
            {orders.length === 0 ? (
                <p>You haven't placed any orders yet.</p>
            ) : (
                <ul>
                    {orders.map(order => (
                        <li key={order._id} style={{ border: '1px solid #eee', margin: '10px', padding: '10px' }}>
                            <strong>Order ID:</strong> {order.orderId}<br/>
                            <strong>Status:</strong> {order.status}<br/>
                            <strong>Amount:</strong> ${order.totalAmount.toFixed(2)}<br/>
                            <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}<br/>
                            <strong>Courses:</strong>
                            <ul>
                                {order.courses.map(item => (
                                    <li key={item.courseId._id}>{item.courseId.title}</li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OrderHistoryPage;