# Thermal Scanner BLE

This project is a thermal scanner using an AMG8833 sensor connected via Bluetooth Low Energy (BLE) to a React web app for live visualization.

---

## Project Structure

- `arduino/`: Arduino code to read sensor data and send via BLE.
- `web/`: React frontend application to connect to BLE and display thermal heatmap.

---

## Arduino Setup

- Upload `thermal_scanner.ino` (found in the `arduino/` folder) to your ESP32 or compatible Arduino board.
- Requires Seeed AMG8833 thermal sensor.
- BLE device name: `SL2MetaBLE_Test`
- BLE Service UUID and Characteristics are defined in the sketch.

---

## React Frontend Setup

1. Navigate to the `web/` folder:
2. Install dependencies:
3. Start the React app:
4. Open your browser (Chrome recommended) and go to `http://localhost:3000`.
5. Click the **Connect BLE** button to connect to the thermal scanner device and start visualizing data.

---

## How It Works

- Arduino reads an 8×8 matrix of temperature data and sends it as CSV strings over BLE.
- React app subscribes to BLE notifications for:
- Raw 64-pixel temperature data
- Average temperature
- Maximum temperature
- React app interpolates the raw data for a smooth heatmap on an HTML canvas.
- Average and maximum temperatures are displayed below the heatmap in real time.

---

## BLE Service and Characteristics

- **BLE Device Name:** `SL2MetaBLE_Test`
- **Service UUID:** `f5e10000-6b9b-11ee-b962-0242ac120002`
- **Characteristics:**
- Raw data (64 floats as CSV string): `f5e10001-6b9b-11ee-b962-0242ac120002`
- Average temperature (float string): `f5e10002-6b9b-11ee-b962-0242ac120002`
- Maximum temperature (float string): `f5e10003-6b9b-11ee-b962-0242ac120002`

---

## Troubleshooting

- Ensure the BLE device is powered on and advertising.
- Use a supported browser with Web Bluetooth API support (Chrome is recommended).
- Allow Bluetooth permissions when prompted by the browser.
- Check the browser console for any connection or runtime errors.

