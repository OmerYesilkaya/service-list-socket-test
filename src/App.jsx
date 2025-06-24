import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const SOCKET_URL = "wss://stage.mindbricks.com";

function createSocket(token) {
    if (!token) return null;
    const socketOptions = {
        path: "/api/bff-ai/socket",
        auth: { token: `Bearer ${token}` },
        autoConnect: false,
    };
    try {
        return io(SOCKET_URL, socketOptions);
    } catch (err) {
        alert(err);
    }
}

export default function App() {
    const socketRef = useRef(null);
    const [token, setToken] = useState(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJiY2E0YmY5OWJkNzc0YTU2YmY5NGQyZWYyMjYyYTIwMyIsInVzZXJJZCI6IjE5NjU4MmIyLWVlZGItNGJkZi1hMzkwLTMyMWZlYWZiZWRjZCIsImVtYWlsIjoib21lci55ZXNpbGtheWFAaGV4YXdvcmtzLmNvbSIsImxvZ2luRGF0ZSI6IjIwMjUtMDYtMjRUMTE6NTQ6NTkuMDU4WiIsImlhdCI6MTc1MDc2NjA5OX0.mbIhwr58STeLEFWe4XPUwT4Dizua8MFZNeRI23WPBxM"
    );
    const [projectId, setProjectId] = useState("197a3985-b515-4423-bbde-2c3d21e825d5");
    const [message, setMessage] = useState("No connection established yet...");
    const [serviceList, setServiceList] = useState([]);

    function handleSocketConnection() {
        if (!token) return;
        socketRef.current = createSocket(token, projectId);
        socketRef.current.auth = {
            ...socketRef.current.auth,
            projectId,
        };

        socketRef.current.on("connect", () => {
            setMessage("Connection established...");
        });

        socketRef.current.on("disconnect", () => {
            setMessage("Disconnected...");
        });

        socketRef.current.connect();
    }

    function handleEmitMessage(prompt) {
        if (!socketRef.current) return;
        socketRef.current.emit("prompt", {
            projectId,
            agent: "project-manager",
            prompt,
            isAuto: false,
        });
    }

    useEffect(() => {
        if (!socketRef.current) return;
        const socket = socketRef.current;

        socket.on("service-list", (data) => {
            console.log("Service list recieved: ", data);
            setServiceList(data);
        });

        return () => {
            socket.off("service-list");
        };
    }, [token, projectId]);

    useEffect(() => {
        return () => {
            if (!socketRef.current) return;
            socketRef.current.disconnect();
        };
    }, []);

    return (
        <div className="App">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
                <input placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} />
                <button onClick={handleSocketConnection}>create socket connection</button>
            </div>

            <br />
            <span>{message}</span>
            <br />
            <br />

            <button onClick={() => handleEmitMessage("")}>emit empty message</button>
            <button onClick={() => handleEmitMessage("Finalize")}>emit finalize message</button>

            <br />

            {serviceList.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        border: "1px solid",
                        padding: "2px",
                        borderRadius: "4px",
                        marginTop: "10px",
                    }}
                >
                    {serviceList.map((s) => {
                        return <div key={s.name}>{JSON.stringify(s)}</div>;
                    })}
                </div>
            )}
        </div>
    );
}
