import React, { useState, useRef, useEffect } from "react";

function App() {
  const [device, setDevice] = useState(null);
  const [server, setServer] = useState(null);
  const [rawData, setRawData] = useState(
    [...Array(8)].map(() => Array(8).fill(0))
  );
  const [avgTemp, setAvgTemp] = useState(0);
  const [maxTemp, setMaxTemp] = useState(0);

  const canvasRef = useRef(null);

  const SERVICE_UUID = "f5e10000-6b9b-11ee-b962-0242ac120002";
  const RAW_UUID = "f5e10001-6b9b-11ee-b962-0242ac120002";
  const AVG_UUID = "f5e10002-6b9b-11ee-b962-0242ac120002";
  const MAX_UUID = "f5e10003-6b9b-11ee-b962-0242ac120002";
  const DEVICE_NAME = "SL2MetaBLE_Test";

  const connect = async () => {
    try {
      const dev = await navigator.bluetooth.requestDevice({
        filters: [{ name: DEVICE_NAME }],
        optionalServices: [SERVICE_UUID],
      });

      setDevice(dev);
      const serv = await dev.gatt.connect();
      setServer(serv);

      const service = await serv.getPrimaryService(SERVICE_UUID);

      const rawChar = await service.getCharacteristic(RAW_UUID);
      const avgChar = await service.getCharacteristic(AVG_UUID);
      const maxChar = await service.getCharacteristic(MAX_UUID);

      await rawChar.startNotifications();
      rawChar.addEventListener("characteristicvaluechanged", handleRaw);

      await avgChar.startNotifications();
      avgChar.addEventListener("characteristicvaluechanged", handleAvg);

      await maxChar.startNotifications();
      maxChar.addEventListener("characteristicvaluechanged", handleMax);
    } catch (err) {
      console.error("BLE connection error:", err);
    }
  };

  const handleRaw = (event) => {
    const value = new TextDecoder().decode(event.target.value);
    const nums = value.split(",").map(Number);
    if (nums.length === 64) {
      const matrix = [];
      for (let i = 0; i < 8; i++) {
        matrix.push(nums.slice(i * 8, i * 8 + 8));
      }
      setRawData(matrix);
    }
  };

  const handleAvg = (event) => {
    const value = new TextDecoder().decode(event.target.value);
    setAvgTemp(parseFloat(value));
  };

  const handleMax = (event) => {
    const value = new TextDecoder().decode(event.target.value);
    setMaxTemp(parseFloat(value));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const srcSize = 8;
    const dstSize = 64;
    const scale = canvas.width / dstSize;

    const flat = rawData.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);

    const getColor = (value) => {
      const norm = (value - min) / (max - min || 1);
      const hue = (1 - norm) * 240; // blue -> red
      return `hsl(${hue}, 100%, 50%)`;
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // interpolate
    for (let y = 0; y < dstSize; y++) {
      for (let x = 0; x < dstSize; x++) {
        const gx = (x / dstSize) * (srcSize - 1);
        const gy = (y / dstSize) * (srcSize - 1);

        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const x1 = Math.min(x0 + 1, srcSize - 1);
        const y1 = Math.min(y0 + 1, srcSize - 1);

        const dx = gx - x0;
        const dy = gy - y0;

        const v00 = rawData[y0][x0];
        const v10 = rawData[y0][x1];
        const v01 = rawData[y1][x0];
        const v11 = rawData[y1][x1];

        const value =
          v00 * (1 - dx) * (1 - dy) +
          v10 * dx * (1 - dy) +
          v01 * (1 - dx) * dy +
          v11 * dx * dy;

        ctx.fillStyle = getColor(value);
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // face mask
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.ellipse(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.45,
      canvas.height * 0.48,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }, [rawData]);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <button
        onClick={connect}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        {device && server ? "Connected" : "Connect BLE"}
      </button>

      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        style={{
          display: "block",
          margin: "20px auto",
          background: "#000",
          borderRadius: "50%",
        }}
      />

      <div style={{ fontSize: "18px" }}>
        <div>Average: {avgTemp.toFixed(2)} °C</div>
        <div>Max: {maxTemp.toFixed(2)} °C</div>
      </div>
    </div>
  );
}

export default App;
