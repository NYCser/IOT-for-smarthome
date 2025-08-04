#include <Arduino.h>
#if defined(ESP32)
  #include <WiFi.h>
  #include <DHT.h>
  #include <LittleFS.h>
  #include <FirebaseESP32.h>
  #include <Wire.h>
  #include <addons/RTDBHelper.h>
  #include <LiquidCrystal_I2C.h>
  #define I2C_SDA 21
  #define I2C_SCL 22
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
#endif
#include <ESP_Mail_Client.h>
#define WIFI_SSID "1103"
#define WIFI_PASSWORD "12345678"
#define SMTP_HOST "smtp.gmail.com"
#define SMTP_PORT 465
#define DATABASE_URL "https://smart-ebaf3-default-rtdb.firebaseio.com/" 
#define DATABASE_SECRET "AIzaSyCRuYjFavXfLkTiGYmDcyEgfiiyJCztgfI"
#define USER_EMAIL "aneuro2020@gmail.com"
#define USER_PASSWORD "Binhan1010@"

#define AUTHOR_EMAIL "aneuro2020@gmail.com"
#define AUTHOR_PASSWORD "khlkwkxtmejaozmc"
#define RECIPIENT_EMAIL "aneuro2020@gmail.com"
#define DHTPIN1 18 
#define DHTPIN2 17 
#define LED1 16
#define LED2 14
#define BUZZER1 15
#define BUZZER2 19
#define BT1 25
#define BT2 26
#define BT3 27
#define DHTTYPE DHT11
DHT dht1(DHTPIN1, DHTTYPE);
DHT dht2(DHTPIN2, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2); 
SMTPSession smtp;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
float h1, t1, h2, t2;
int thrh1, thrh2, thrt1, thrt2;
bool email, alroom1, alroom2;
bool ttlcd;
bool light1, light2;
bool btPressed1 = false;  
bool btPressed2 = false;  
bool btPressed3 = false;  
unsigned long lastAlertTime = 0;  
const unsigned long alertInterval = 30000;  
bool alertSent = false;  
int timealert=0;
unsigned long lastDebounceTime1 = 0;  
unsigned long lastDebounceTime2 = 0;      
unsigned long lastDebounceTime3 = 0;  
const unsigned long debounceDelay = 20;  
FirebaseJson json;
FirebaseJsonData result;

void smtpCallback(SMTP_Status status);
void interruptlcd();
void interruptalert1();
void interruptalert2();
Session_Config emailConfig;

void setupEmail() {
  emailConfig.server.host_name = SMTP_HOST;
  emailConfig.server.port = SMTP_PORT;
  emailConfig.login.email = AUTHOR_EMAIL;
  emailConfig.login.password = AUTHOR_PASSWORD;
  emailConfig.time.ntp_server = F("pool.ntp.org");
  emailConfig.time.gmt_offset = 3;
}

void setup(){
  Serial.begin(115200);
  pinMode(0,INPUT_PULLUP);
  pinMode(LED1,OUTPUT);
  pinMode(LED2,OUTPUT);
  pinMode(BUZZER1,OUTPUT);
  pinMode(BUZZER2,OUTPUT);
  pinMode(BT1,INPUT_PULLUP);
  pinMode(BT2,INPUT_PULLUP);
  pinMode(BT3,INPUT_PULLUP);
  digitalWrite(LED1,LOW);
  digitalWrite(LED2,LOW);
  digitalWrite(BUZZER1,LOW);
  digitalWrite(BUZZER2,LOW);
  attachInterrupt(digitalPinToInterrupt(BT1),interruptlcd,FALLING);
  attachInterrupt(digitalPinToInterrupt(BT2),interruptalert1,FALLING);
  attachInterrupt(digitalPinToInterrupt(BT3),interruptalert2,FALLING);
  lcd.init(I2C_SDA, I2C_SCL);
	lcd.backlight();
  lcd.setCursor(0,0);
  lcd.print("Connect WiFi");
  lcd.setCursor(0,1);
  lcd.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED){
    digitalWrite(2,HIGH);
    delay(20);
    digitalWrite(2,LOW);
    delay(20);
  }
  Serial.println("Connected to WiFi");
  if(!LittleFS.begin(true)){
    Serial.println("LittleFS Mount Failed");
    return;
  }
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  Firebase.reconnectNetwork(true);
  fbdo.setBSSLBufferSize(4096, 1024);
  Serial.println("Connecting to Firebase...");
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  int retry = 0;
  while (!Firebase.ready() && retry < 5) {
    Serial.print(".");
    delay(500);
    retry++;
  }
  if (Firebase.ready()) {
    Serial.println("\nFirebase connected successfully!");
  } else {
    Serial.println("\nFirebase connection failed!");
    Serial.print("Error: ");
    Serial.println(fbdo.errorReason());
  }
  MailClient.networkReconnect(true);
  smtp.debug(0); 
  smtp.callback(smtpCallback);
  setupEmail();
  Serial.println("Connected email");
  dht1.begin();
  dht2.begin();
  Serial.println("Connected DHT");
}

unsigned long lastTimealert = 0;
unsigned long currentTimealert = 0;
void sendEmailOnBootPress(int value) {
  if(email == 1 && timealert == 0){
    unsigned long startTime = millis();
    
    Session_Config config;
    config.server.host_name = SMTP_HOST;
    config.server.port = SMTP_PORT;
    config.login.email = AUTHOR_EMAIL;
    config.login.password = AUTHOR_PASSWORD;
    config.time.ntp_server = F("pool.ntp.org");
    config.time.gmt_offset = 3;

    SMTP_Message message;
    message.sender.name = F("ESP32");
    message.sender.email = AUTHOR_EMAIL;
    
    if(value == 1){
      message.subject = F("CẢNH BÁO NHIỆT ĐỘ PHÒNG 1");
    }
    else if(value == 2){
      message.subject = F("CẢNH BÁO ĐỘ ẨM PHÒNG 1");
    }
    else if(value == 3){
      message.subject = F("CẢNH BÁO NHIỆT ĐỘ PHÒNG 2");
    }
    else if(value == 4){
      message.subject = F("CẢNH BÁO ĐỘ ẨM PHÒNG 2");
    }
    message.addRecipient(F("User"), RECIPIENT_EMAIL);
    
    char emailContent[150];
    snprintf(emailContent, sizeof(emailContent), "PHÒNG 1: \n   NHIỆT ĐỘ: %.1f°C\n   ĐỘ ẨM: %.1f%%\nPHÒNG 2:\n   NHIỆT ĐỘ: %.1f°C\n   ĐỘ ẨM: %.1f%%", t1, h1, t2, h2);
    message.text.content = emailContent;
    message.text.charSet = "us-ascii";
    message.text.transfer_encoding = Content_Transfer_Encoding::enc_7bit;
    message.priority = esp_mail_smtp_priority::esp_mail_smtp_priority_high;
    smtp.debug(0);
    
    Serial.println("Sending email...");
    if (!smtp.connect(&config) || !MailClient.sendMail(&smtp, &message)) {
      Serial.print("Email failed: ");
      Serial.println(smtp.errorReason().c_str());
    } else {
      Serial.printf("Email sent in %lu ms\n", millis() - startTime);
    }
    
    lastTimealert = millis();
    timealert = 1;
  }
  else if(email == 1 && timealert != 0)
  {
    currentTimealert = millis();
    if(currentTimealert - lastTimealert >= 1000){
      lastTimealert = currentTimealert;
      timealert++;
      if(timealert == 30){
        timealert = 0;
      }
    }
  }
  else{
    timealert = 0;
  }
}
void interruptlcd(){
  unsigned long currentTime1 = millis();
  if (currentTime1 - lastDebounceTime1 > debounceDelay) {
    btPressed1 = true;  
    lastDebounceTime1 = currentTime1;
  }
}
void interruptalert1(){
  unsigned long currentTime2 = millis();
  if (currentTime2 - lastDebounceTime2 > debounceDelay) {
    btPressed2 = true;  
    lastDebounceTime2 = currentTime2;
  }
}
void interruptalert2(){
  unsigned long currentTime3 = millis();
  if (currentTime3 - lastDebounceTime3 > debounceDelay) {
    btPressed3 = true;  
    lastDebounceTime3 = currentTime3;
  }
}
void getstatus();
void printlcd();
void updateTH();
void getdht();
void onofflight();
void alertbuzzer();
void loop() {
  getstatus();
  getdht();
  printlcd();
  updateTH();
  onofflight();
  if(btPressed2){
    Firebase.setBool(fbdo, "/alerts/room1/enabled", !alroom1);
    btPressed2 = false;
  }
  if(btPressed3){
    Firebase.setBool(fbdo, "/alerts/room2/enabled", !alroom2);
    btPressed3 = false;
  }
  alertbuzzer();

}

void smtpCallback(SMTP_Status status){
  if (status.success()){
    Serial.println("Email sent successfully");
    smtp.sendingResult.clear();
  }
}
void alertbuzzer(){
  if(alroom1 == 1){
    if(t1 > (float)thrt1 || h1 > (float)thrh1){
      digitalWrite(BUZZER1,HIGH);
      
    } else {
      digitalWrite(BUZZER1,LOW);
    }
  } else {
    digitalWrite(BUZZER1,LOW);
  }
  if(t1 > (float)thrt1) sendEmailOnBootPress(1);
  if(h1 > (float)thrh1) sendEmailOnBootPress(2);
  if(alroom2 == 1){
    if(t2 > (float)thrt2 || h2 > (float)thrh2){
      digitalWrite(BUZZER2,HIGH);
      
    } else {
      digitalWrite(BUZZER2,LOW);
    }
  } else {
    digitalWrite(BUZZER2,LOW);
  }
  if(t2 > (float)thrt2) sendEmailOnBootPress(3);
  if(h2 > (float)thrh2) sendEmailOnBootPress(4);
}
void printlcd(){
  if (btPressed1) {
     ttlcd = !ttlcd;
     lcd.clear();
     btPressed1 = false;  
    }
  if(ttlcd == 0) {  
    lcd.setCursor(0,0);
    lcd.print("Room 1:         ");
    lcd.setCursor(0,1);
    char tempStr[40];
    sprintf(tempStr, "%.1f", t1);
    lcd.print(tempStr);
    lcd.write(223);  
    sprintf(tempStr, "C, %.1f%%", h1);
    lcd.print(tempStr);
  } else {
    lcd.setCursor(0,0);
    lcd.print("Room 2:         ");
    lcd.setCursor(0,1);
    char tempStr[40];
    sprintf(tempStr, "%.1f", t2);
    lcd.print(tempStr);
    lcd.write(223);  
    sprintf(tempStr, "C, %.1f%%", h2);
    lcd.print(tempStr);
  }
}
void getstatus(){
    if (Firebase.get(fbdo, "/")) {
      if (fbdo.dataType() == "json") {
        FirebaseJson &jsonData = fbdo.jsonObject();
        
        jsonData.get(result, "/thresholds/room1/temperature/value");
        if (result.success) thrt1 = result.to<int>();
        
        jsonData.get(result, "/thresholds/room1/humidity/value");
        if (result.success) thrh1 = result.to<int>();
        
        jsonData.get(result, "/thresholds/room2/temperature/value");
        if (result.success) thrt2 = result.to<int>();
        
        jsonData.get(result, "/thresholds/room2/humidity/value");
        if (result.success) thrh2 = result.to<int>();
        
        jsonData.get(result, "/alerts/email/enabled");
        if (result.success) email = result.to<bool>();
        
        jsonData.get(result, "/alerts/room1/enabled");
        if (result.success) alroom1 = result.to<bool>();
        
        jsonData.get(result, "/alerts/room2/enabled");
        if (result.success) alroom2 = result.to<bool>();
        
        jsonData.get(result, "/devices/room1/light/status");
        if (result.success) light1 = result.to<bool>();
        
        jsonData.get(result, "/devices/room2/light/status");
        if (result.success) light2 = result.to<bool>();
        
        Serial.printf("Thresholds: room1: T:%d, H:%d, room2: T:%d, H:%d\n", thrt1, thrh1, thrt2, thrh2);
        Serial.printf("Alerts: email: %d, room1: %d, room2: %d\n", email, alroom1, alroom2);
        Serial.printf("Light: room1: %d, room2: %d\n", light1, light2);
      }
    }
}
void updateTH(){
    Serial.printf("Room 1 - T: %.1f, H: %.1f\n", t1, h1);
    Serial.printf("Room 2 - T: %.1f, H: %.1f\n", t2, h2);
    json.set("/room1/temperature",t1);
    json.set("/room1/humidity",h1);
    json.set("/room2/temperature",t2);
    json.set("/room2/humidity",h2);

if (Firebase.updateNode(fbdo, "/sensors", json)) {
  Serial.println("update done");
} else {
  Serial.print("error: ");
  Serial.println(fbdo.errorReason());
}
}
void getdht(){
  static unsigned long lastReadTime = 0;
  unsigned long currentTime = millis();
  if (currentTime - lastReadTime > 200) {
    lastReadTime = currentTime;
    h1 = dht1.readHumidity();
    t1 = dht1.readTemperature();
    h2 = dht2.readHumidity();
    t2 = dht2.readTemperature();
    Serial.printf("Nhiệt độ: %.1f°C, Độ ẩm: %.1f%%\n", t1, h1);
    Serial.printf("Nhiệt độ: %.1f°C, Độ ẩm: %.1f%%\n", t2, h2);
  }
}
void onofflight(){
  if(light1 == 1){
    digitalWrite(LED1,HIGH);
  } else {
    digitalWrite(LED1,LOW);
  }
  if(light2 == 1){
    digitalWrite(LED2,HIGH);
  } else {
    digitalWrite(LED2,LOW);
  }
}