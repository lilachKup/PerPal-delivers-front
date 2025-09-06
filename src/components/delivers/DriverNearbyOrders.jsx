import React, { useEffect, useRef, useState } from "react";
import "./DriverNearbyOrders.css";
import TopBar from "./TopBar";

const CHECK_IN_DELIVERY_BASE =
    "https://h3caad343d.execute-api.us-east-1.amazonaws.com/dev/checkIfDeliveryInOrder";
const UPDATE_ORDER_URL =
    "https://yv6baxe2i0.execute-api.us-east-1.amazonaws.com/dev/updateOrderFromStore";
const NEARBY_ORDERS_BASE =
    "https://5uos9aldec.execute-api.us-east-1.amazonaws.com/dev/ordersNearbyToMe";
const FINISH_DELIVERY_URL =
    "https://h3caad343d.execute-api.us-east-1.amazonaws.com/dev/finishDelivery";

const safeFixed = (val, digits = 1) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(digits) : "—";
};
const fmtCurrency = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(2) : "—";
};

const parseLatLngStr = (s) => {
    if (!s || typeof s !== "string") return null;
    const [lat, lng] = s.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
};

const buildGmapsUrl = ({ originLat, originLon, destLat, destLng }) => {
    const base = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
    const origin =
        Number.isFinite(originLat) && Number.isFinite(originLon)
            ? `&origin=${originLat},${originLon}`
            : "";
    const dest =
        Number.isFinite(destLat) && Number.isFinite(destLng)
            ? `&destination=${destLat},${destLng}`
            : "";
    return `${base}${origin}${dest}`;
};

const DriverOrder = ({ driver_first_name, driver_last_name, driver_id, driver_email }) => {
    const [coordinates, setCoordinates] = useState({ lon: 0, lat: 0 });
    const [orders, setOrders] = useState([]);
    const [dailyEarnings, setDailyEarnings] = useState(0);
    const [inDelivery, setInDelivery] = useState(false);
    const [orderToDeliver, setOrderToDeliver] = useState(null);
    const [time, setTime] = useState(new Date());
    const [finishing, setFinishing] = useState(false);

    const ordersPollRef = useRef(null);
    const locationPollRef = useRef(null);
    const timeTickRef = useRef(null);

    const deliverName = `${driver_first_name} ${driver_last_name}`;

    // נקודת ייחוס זמנית (לטסטים)
    const latTelAvivAza25 = 32.046923;
    const lonTelAvivAza25 = 34.759446;

    // ---------- APIs ----------

    const checkInDelivery = async (driverId) => {
        if (!driverId) return { inDelivery: false, order: null };

        try {
            const res = await fetch(
                `${CHECK_IN_DELIVERY_BASE}/${encodeURIComponent(driverId)}`,
                { method: "GET", headers: { "Content-Type": "application/json" } }
            );
            if (!res.ok) {
                const text = await res.text();
                console.error("checkInDelivery failed:", res.status, text);
                return { inDelivery: false, order: null };
            }
            const data = await res.json();

            const ordersArr = Array.isArray(data?.orders)
                ? data.orders
                : data?.order
                    ? [data.order]
                    : [];
            const active = ordersArr.length > 0;
            const first = active ? ordersArr[0] : null;

            const mapped =
                first && {
                    storeId: first.store_id ?? "—",
                    id: first.order_num ?? "—",
                    customerName: first.customer_name ?? "—",
                    customerLocation: first.customer_Location ?? first.customer_Location ?? "—",
                    customerMail: first.customer_mail ?? "—",
                    totalPrice: Number(first.total_price) || NaN,
                    earn: (Number(first.total_price) || 0) * 0.08,
                    storeCoordinatesStr: first.store_coordinates ?? null,
                    storeDest: parseLatLngStr(first.store_coordinates ?? null),
                };

            // אם חסר coords—נביא לפי storeId
            if (mapped && !mapped.storeCoordinatesStr && mapped.storeId !== "—") {
                try {
                    const coordsRes = await fetch(
                        `https://5uos9aldec.execute-api.us-east-1.amazonaws.com/dev/getCoordinatesFromStoreByID/${encodeURIComponent(
                            mapped.storeId
                        )}`,
                        { method: "GET", headers: { "Content-Type": "application/json" } }
                    );
                    const coordsText = await coordsRes.text(); // "lat,lng"
                    if (coordsText && coordsText.includes(",")) {
                        mapped.storeCoordinatesStr = coordsText.replace(/"/g, "");
                        mapped.storeDest = parseLatLngStr(mapped.storeCoordinatesStr);
                    }
                } catch (err) {
                    console.error("⚠️ Failed to fetch store coordinates:", err);
                }
            }

            return { inDelivery: active, order: mapped || null };
        } catch (err) {
            console.error("checkInDelivery error:", err);
            return { inDelivery: false, order: null };
        }
    };

    const fetchNearbyOrders = async () => {
        try {
            const response = await fetch(
                `${NEARBY_ORDERS_BASE}/${latTelAvivAza25}/${lonTelAvivAza25}`,
                { method: "GET", headers: { "Content-Type": "application/json" } }
            );
            const data = await response.json();

            if (!data?.orders?.length) {
                setOrders([]);
                return;
            }

            const formatted = data.orders.map((order) => {
                const totalPriceNum = Number(order?.total_price);
                const storeCoordsStr = order?.store_coordinates ?? null;
                const storeDest = parseLatLngStr(storeCoordsStr);
                return {
                    storeId: order?.store_id ?? "—",
                    id: order?.order_num ?? "—",
                    customerName: order?.customer_name ?? "—",
                    customerLocation:
                        order?.customer_location ?? order?.customer_Location ?? "—",
                    customerMail: order?.customer_mail ?? "—",
                    totalPrice: Number.isFinite(totalPriceNum) ? totalPriceNum : NaN,
                    earn: Number.isFinite(totalPriceNum) ? totalPriceNum * 0.08 : NaN,
                    storeCoordinatesStr: storeCoordsStr,
                    storeDest,
                };
            });

            setOrders(formatted);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const updateDriverLocationOnce = () => {
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

    const getNewOrder = async (order) => {
        try {
            const responseOfUpdateOrderStatus = await fetch(UPDATE_ORDER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_num: order.id,
                    store_id: order.storeId,
                    order_status: "in delivery",
                    driver_id: driver_id,
                }),
            });

            if (!responseOfUpdateOrderStatus.ok) {
                const errBody = await responseOfUpdateOrderStatus.text();
                throw new Error(
                    `HTTP ${responseOfUpdateOrderStatus.status}: ${errBody}`
                );
            }

            const data = await responseOfUpdateOrderStatus.json();
            console.log("✅ update ok:", data);

            setOrderToDeliver(order);
            setInDelivery(true);
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
        } catch (err) {
            console.error("❌ updateOrderFromStore error:", err);
        }
    };

    // סיום משלוח: מחיקה מה-Orders לפי store_id, order_num, driver_id
    const finishCurrentDelivery = async () => {
        if (!orderToDeliver) return;
        setFinishing(true);
        try {
            const res = await fetch(FINISH_DELIVERY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    store_id: orderToDeliver.storeId,
                    order_num: orderToDeliver.id,
                    driver_id: driver_id,
                    driver_email: driver_email,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`FinishDelivery failed: ${res.status} ${text}`);
            }

            const data = await res.json();
            console.log("✅ finishDelivery ok:", data);

            // שחרור המשלוח וחזרה לרשימת ההזמנות
            setOrderToDeliver(null);
            setInDelivery(false);
            await fetchNearbyOrders(); // רענון מיידי
        } catch (err) {
            console.error("❌ finishDelivery error:", err);
            alert("Failed to finish delivery. Please try again.");
        } finally {
            setFinishing(false);
        }
    };

    // ---------- Effects ----------

    // בדיקת משלוח פעיל בזמן mount/שינוי driver_id
    useEffect(() => {
        let cancelled = false;
        (async () => {
            console.log(`DriverOrder mounted for driver_id=${driver_id}`);
            const { inDelivery: active, order } = await checkInDelivery(driver_id);
            if (cancelled) return;

            if (active && order) {
                console.log("Driver has active delivery:", order);
                setInDelivery(true);
                setOrderToDeliver(order);
                setOrders([]);
            } else {
                setInDelivery(false);
                setOrderToDeliver(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [driver_id]);

    // שעון + מיקום כל דקה
    useEffect(() => {
        timeTickRef.current = setInterval(() => setTime(new Date()), 1000);
        updateDriverLocationOnce();
        locationPollRef.current = setInterval(updateDriverLocationOnce, 60000);

        return () => {
            if (timeTickRef.current) clearInterval(timeTickRef.current);
            if (locationPollRef.current) clearInterval(locationPollRef.current);
        };
    }, []);

    // פולינג של הזמנות: רק כשאין משלוח פעיל
    useEffect(() => {
        if (inDelivery) {
            if (ordersPollRef.current) {
                clearInterval(ordersPollRef.current);
                ordersPollRef.current = null;
            }
            setOrders([]);
            return;
        }

        (async () => {
            await fetchNearbyOrders();
        })();

        ordersPollRef.current = setInterval(fetchNearbyOrders, 60000);

        return () => {
            if (ordersPollRef.current) {
                clearInterval(ordersPollRef.current);
                ordersPollRef.current = null;
            }
        };
    }, [inDelivery]);

    // חישוב רווח
    useEffect(() => {
        const inDeliveryEarn = orderToDeliver
            ? Number(orderToDeliver.totalPrice) * 0.08
            : 0;
        setDailyEarnings(Number.isFinite(inDeliveryEarn) ? inDeliveryEarn : 0);
    }, [orderToDeliver]);

    // ---------- UI ----------

    return (
        <>
            <TopBar />
            <div>
                <header className="driver-header">
                    <h2 className="driver-name-title">Welcome back {deliverName} 👋</h2>

                    <div className="info-staff">
                        <div className="daily-earnings">
                            💰 Daily Earnings: ₪{fmtCurrency(dailyEarnings)}
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
                                        <p>
                                            <strong>Order ID:</strong> {orderToDeliver.id}
                                        </p>
                                        <p>
                                            <strong>Store ID:</strong> {orderToDeliver.storeId}
                                        </p>
                                        <p>
                                            <strong>Client:</strong> {orderToDeliver.customerName}
                                        </p>
                                        <p>
                                            <strong>Email:</strong> {orderToDeliver.customerMail}
                                        </p>
                                        <p>
                                            <strong>Location:</strong>{" "}
                                            {orderToDeliver.customerLocation}
                                        </p>
                                        <p>
                                            <strong>Total Price:</strong> ₪
                                            {fmtCurrency(orderToDeliver.totalPrice)}
                                        </p>
                                        <p>
                                            <strong>Earn (8%):</strong> ₪
                                            {fmtCurrency(Number(orderToDeliver.totalPrice) * 0.08)}
                                        </p>

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

                                        {/* Finish Delivery */}
                                        <button
                                            className="finish-delivery-button"
                                            onClick={finishCurrentDelivery}
                                            disabled={finishing}
                                        >
                                            {finishing ? "Finishing..." : "Finish Delivery"}
                                        </button>
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
                                            <div
                                                key={order.id || `${order.storeId}-${Math.random()}`}
                                                className="order-card"
                                            >
                                                <h4>Order #{order.id}</h4>
                                                <p>
                                                    <strong>Store ID:</strong> {order.storeId}
                                                </p>
                                                <p>
                                                    <strong>Client:</strong> {order.customerName}
                                                </p>
                                                <p>
                                                    <strong>Email:</strong> {order.customerMail}
                                                </p>
                                                <p>
                                                    <strong>Location:</strong> {order.customerLocation}
                                                </p>
                                                <p>
                                                    <strong>Total Price:</strong> ₪
                                                    {fmtCurrency(order.totalPrice)}
                                                </p>
                                                <p>
                                                    <strong>Earn (8%):</strong>{" "}
                                                    {safeFixed(order.earn, 1)}
                                                </p>

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
        </>
    );
};

export default DriverOrder;
