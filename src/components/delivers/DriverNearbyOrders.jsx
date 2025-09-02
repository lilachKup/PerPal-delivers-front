import React, { useEffect, useState } from "react";
import "./DriverNearbyOrders.css";

// עזרי פורמט בטוחים
const safeFixed = (val, digits = 1) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(digits) : "—";
};
const fmtCurrency = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(2) : "—";
};

// מפרש מחרוזת "lat,lon" לאובייקט {lat, lng}
const parseLatLngStr = (s) => {
    if (!s || typeof s !== "string") return null;
    const [lat, lng] = s.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
};

// בונה קישור ניווט ל-Google Maps
const buildGmapsUrl = ({ originLat, originLon, destLat, destLng }) => {
    const base = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
    const origin = (Number.isFinite(originLat) && Number.isFinite(originLon))
        ? `&origin=${originLat},${originLon}`
        : ""; // אם אין מיקום נהג, ניתן להשמיט ו-Google ייקח "המיקום הנוכחי"
    const dest = (Number.isFinite(destLat) && Number.isFinite(destLng))
        ? `&destination=${destLat},${destLng}`
        : "";
    return `${base}${origin}${dest}`;
};

const DriverOrder = ({driver_first_name, driver_last_name}) => {
    const [coordinates, setCoordinates] = useState({ lon: 0, lat: 0 });
    const [orders, setOrders] = useState([]);
    const [dailyEarnings, setDailyEarnings] = useState(0);
    const [inDelivery, setInDelivery] = useState(false);
    const [orderToDeliver, setOrderToDeliver] = useState(null);
    const [time, setTime] = useState(new Date());

    const deliverName = `${driver_first_name} ${driver_last_name}`;
    const latTelAvivAza25 = 32.0469230;
    const lonTelAvivAza25 = 34.7594460;

    const getNewOrder = async (order) => {
        //todo update order status in DB to "in delivery"
        try {
            const responseOfUpdateOrderStatus = await fetch(
                "https://yv6baxe2i0.execute-api.us-east-1.amazonaws.com/dev/updateOrderFromStore",
                {
                    method: "POST", // 👈 POST, לא PUT
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        order_num: order.id,        // או order.order_num אם זה השדה האמיתי
                        store_id: order.storeId,    // או order.store_id
                        order_status: "in delivery" // 👈 חייב להתאים ל-Lambda
                    })
                }
            );

            if (!responseOfUpdateOrderStatus.ok) {
                const errBody = await responseOfUpdateOrderStatus.text();
                throw new Error(`HTTP ${responseOfUpdateOrderStatus.status}: ${errBody}`);
            }

            const data = await responseOfUpdateOrderStatus.json();
            console.log("✅ update ok:", data);
            setOrderToDeliver(order);
            setInDelivery(true);
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
        } catch (err) {
            console.error("❌ updateOrderFromStore error:", err);
        }







    }

    useEffect(() => {
        const updateLocation = () => {
            if (!navigator.geolocation) {
                console.error("Geolocation is not supported by this browser.");
                return;
            }
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const { longitude, latitude } = coords || {};
                    if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
                        setCoordinates({ lon: longitude, lat: latitude });
                    }
                },
                (error) => console.error("Error getting location:", error)
            );
        };

        const getOrders = async () => {
            try {
                const response = await fetch(
                    `https://5uos9aldec.execute-api.us-east-1.amazonaws.com/dev/ordersNearbyToMe/${latTelAvivAza25}/${lonTelAvivAza25}`,
                    { method: "GET", headers: { "Content-Type": "application/json" } }
                );
                const data = await response.json();

                if (!data?.orders?.length) {
                    console.log("❌ No orders found");
                    setOrders([]);
                    return;
                }

                const formatted = data.orders.map((order) => {
                    const totalPriceNum = Number(order?.total_price);
                    const storeCoordsStr = order?.store_coordinates ?? null; // מגיע מה-API שלך
                    const storeDest = parseLatLngStr(storeCoordsStr);        // {lat,lng} או null

                    return {
                        storeId: order?.store_id ?? "—",
                        id: order?.order_num ?? "—",
                        customerName: order?.customer_name ?? "—",
                        customerLocation: order?.customer_location ?? "—",
                        customerMail: order?.customer_mail ?? "—",
                        totalPrice: Number.isFinite(totalPriceNum) ? totalPriceNum : NaN,
                        earn: Number.isFinite(totalPriceNum) ? totalPriceNum * 0.08 : NaN,

                        // חדשים:
                        storeCoordinatesStr: storeCoordsStr, // "lat,lon" לתצוגה
                        storeDest,                           // {lat, lng} לשימוש בקישור ניווט
                    };
                });

                setOrders(formatted);
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };

        updateLocation();
        getOrders();

        const timeId = setInterval(() => setTime(new Date()), 1000);
        const intervalId = setInterval(() => {
            updateLocation();
            getOrders();
        }, 60000);

        return () => {
            clearInterval(timeId);
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        const inDeliveryEarn = orderToDeliver
            ? Number(orderToDeliver.totalPrice) * 0.08
            : 0;
        setDailyEarnings(Number.isFinite(inDeliveryEarn) ? inDeliveryEarn : 0);
    }, [orderToDeliver]);

    return (
        <div>
            {console.log("Rendering DriverOrder with props:", { driver_first_name, driver_last_name })}
            <header className="driver-header">
                <h2 className="driver-name-title">Welcome back {deliverName} 👋</h2>

                <div className="info-staff">
                    <div className="daily-earnings">
                        💰 Daily Earnings: ${fmtCurrency(dailyEarnings)}
                    </div>
                    <div className="current-time">
                        ⏰{" "}
                        {time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </div>
                    <span className="max-km">Max Distance to delivery: 15km </span>
                    <span className="driver-location">
            Your location: {safeFixed(coordinates?.lat, 4)},{" "}
                        {safeFixed(coordinates?.lon, 4)}
          </span>
                </div>
            </header>

            <div className="orders-container">
                <div className="orders">
                    {inDelivery ? (
                        <div className="in-delivery">
                            <h3>In Delivery</h3>
                            {orderToDeliver ? (
                                <>
                                    <p><strong>Order ID:</strong> {orderToDeliver.id}</p>
                                    <p><strong>Store ID:</strong> {orderToDeliver.storeId}</p>
                                    <p><strong>Client:</strong> {orderToDeliver.customerName}</p>
                                    <p><strong>Email:</strong> {orderToDeliver.customerMail}</p>
                                    <p><strong>Location:</strong> {orderToDeliver.customerLocation}</p>
                                    <p><strong>Total Price:</strong> ${fmtCurrency(orderToDeliver.totalPrice)}</p>
                                    <p><strong>Earn (8%):</strong> ${fmtCurrency(Number(orderToDeliver.totalPrice) * 0.08)}</p>

                                    {/* קואורדינטות חנות + קישור ניווט */}
                                    <p>
                                        <strong>Store Coords:</strong>{" "}
                                        {orderToDeliver.storeCoordinatesStr ?? "—"}{" "}
                                        {orderToDeliver.storeDest && (
                                            <a
                                                href={buildGmapsUrl({
                                                    originLat: coordinates.lat,
                                                    originLon: coordinates.lon,
                                                    destLat: orderToDeliver.storeDest.lat,
                                                    destLng: orderToDeliver.storeDest.lng,
                                                })}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="navigate-link"
                                            >
                                                נווט עם Google Maps
                                            </a>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <p>Loading current delivery…</p>
                            )}
                        </div>
                    ) : (
                        <div className="no-delivery">
                            <div className="orders-box">
                                <h3>Available Orders</h3>
                                {orders && orders.length > 0 ? (
                                    orders.map((order) => (
                                        <div key={order.id || `${order.storeId}-${Math.random()}`} className="order-card">
                                            <h4>Order #{order.id}</h4>
                                            <p><strong>Store ID:</strong> {order.storeId}</p>
                                            <p><strong>Client:</strong> {order.customerName}</p>
                                            <p><strong>Email:</strong> {order.customerMail}</p>
                                            <p><strong>Location:</strong> {order.customerLocation}</p>
                                            <p><strong>Total Price:</strong> ${fmtCurrency(order.totalPrice)}</p>
                                            <p><strong>Earn (8%):</strong> ${safeFixed(order.earn, 1)}</p>

                                            {/* קואורדינטות חנות + קישור ניווט */}
                                            <p>
                                                <strong>Store Coords:</strong>{" "}
                                                {order.storeCoordinatesStr ?? "—"}{" "}
                                                {order.storeDest && (
                                                    <a
                                                        href={buildGmapsUrl({
                                                            originLat: coordinates.lat,
                                                            originLon: coordinates.lon,
                                                            destLat: order.storeDest.lat,
                                                            destLng: order.storeDest.lng,
                                                        })}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="navigate-link"
                                                    >
                                                        נווט עם Google Maps
                                                    </a>
                                                )}
                                            </p>

                                            <button
                                                className="accept-order-button"
                                                onClick={() => getNewOrder(order)}
                                                disabled={!order?.id}
                                            >
                                                Accept Order
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p>No available orders at the moment.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverOrder;
