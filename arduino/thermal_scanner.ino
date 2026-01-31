#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "Seeed_AMG8833_driver.h"


// ─── Configuration ─────────────────────────────────────────
#define BLE_NAME         "SL2MetaBLE_Test"


#define SERVICE_UUID     "f5e10000-6b9b-11ee-b962-0242ac120002"
#define CHAR_CH1_UUID    "f5e10001-6b9b-11ee-b962-0242ac120002"  // Raw 64 readings
#define CHAR_CH2_UUID    "f5e10002-6b9b-11ee-b962-0242ac120002"  // Avg temp
#define CHAR_CH3_UUID    "f5e10003-6b9b-11ee-b962-0242ac120002"  // Max temp


constexpr uint32_t TX_INTERVAL_MS = 100;   // 10 Hz


// ─── Globals ───────────────────────────────────────────────
BLECharacteristic *ch1;
BLECharacteristic *ch2;
BLECharacteristic *ch3;
BLEServer        *server = nullptr;
uint32_t          lastTx = 0;


AMG8833 sensor;              // Grove AMG8833 driver
float    pixels_temp[64];    // storage for 8×8 readings


void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);


  // Initialize AMG8833
  if (sensor.init()) {
    Serial.println("AMG8833 init failed!");
    while (1);
  }
  Serial.println("AMG8833 init OK!");


  // Initialize BLE server & characteristics
  BLEDevice::init(BLE_NAME);
  server = BLEDevice::createServer();
  BLEService *svc = server->createService(SERVICE_UUID);


  ch1 = svc->createCharacteristic(CHAR_CH1_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  ch2 = svc->createCharacteristic(CHAR_CH2_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  ch3 = svc->createCharacteristic(CHAR_CH3_UUID, BLECharacteristic::PROPERTY_NOTIFY);


  ch1->addDescriptor(new BLE2902());
  ch2->addDescriptor(new BLE2902());
  ch3->addDescriptor(new BLE2902());


  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->start();


  Serial.println("BLE service started");
}


void loop() {
  uint32_t now = millis();
  if (server->getConnectedCount() > 0 && (now - lastTx >= TX_INTERVAL_MS)) {
    lastTx = now;


    // 1) Read all 64 pixels
    sensor.read_pixel_temperature(pixels_temp);


    // 2) Compute avg & max
    float sum = 0, maxVal = pixels_temp[0];
    for (int i = 0; i < 64; ++i) {
      float t = pixels_temp[i];
      sum += t;
      if (t > maxVal) maxVal = t;
    }
    float avgVal = sum / 64.0f;


    // 3) Build raw CSV string
    char rawBuf[512];
    size_t idx = 0;
    for (int i = 0; i < 64; ++i) {
      // each as e.g. "23.45," (no comma after last)
      idx += snprintf(rawBuf + idx, sizeof(rawBuf) - idx,
                      (i<63) ? "%.2f," : "%.2f",
                      pixels_temp[i]);
    }


    // 4) Send & print raw
    ch1->setValue((uint8_t*)rawBuf, idx);
    ch1->notify();
    Serial.print("RAW [64]: ");
    Serial.println(rawBuf);


    // 5) Send & print avg
    char txt[16];
    int len = snprintf(txt, sizeof(txt), "%.2f", avgVal);
    ch2->setValue((uint8_t*)txt, len);
    ch2->notify();
    Serial.print("AVG: ");
    Serial.println(txt);


    // 6) Send & print max
    len = snprintf(txt, sizeof(txt), "%.2f", maxVal);
    ch3->setValue((uint8_t*)txt, len);
    ch3->notify();
    Serial.print("MAX: ");
    Serial.println(txt);


    // 7) Toggle heartbeat LED
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  }
}


