// Language translations
const translations = {
    en: {
        'title': 'Device Control Panel',
        'auto-enable-room1': 'Room 1 alert has been enabled',
        'auto-enable-room2': 'Room 2 alert has been enabled',
        'auto-enable-email': 'Email alert has been enabled',
        'room1-title': 'Room 1 - Temperature & Humidity',
        'room2-title': 'Room 2 - Temperature & Humidity',
        'room-controls': 'Room Controls',
        'alert-settings': 'Alert Settings',
        'room1-light': 'Room 1 Light',
        'room2-light': 'Room 2 Light',
        'room1-alert': 'Room 1 Alert',
        'room2-alert': 'Room 2 Alert',
        'email-alert': 'Email Alert',
        'temp-threshold': 'Temperature Threshold:',
        'humidity-threshold': 'Humidity Threshold:',
        'confirm-thresholds': 'Confirm Thresholds',
        'high-humidity': 'High Humidity Alert:',
        'threshold': 'Threshold:',
        'warning-title': 'Warning!',
        'cancel-button': 'Cancel',
        'confirm-button': 'Confirm Anyway',
        'temp-warning': 'The temperature threshold you set is {condition}. Normal range is between 20°C and 35°C. Are you sure?',
        'humidity-warning': 'The humidity threshold you set is {condition}. Normal range is between 30% and 70%. Are you sure?',
        'very-high': 'very high',
        'very-low': 'very low'
    },
    vi: {
        'title': 'Bảng Điều Khiển Thiết Bị',
        'auto-enable-room1': 'Đã bật thông báo Phòng 1',
        'auto-enable-room2': 'Đã bật thông báo Phòng 2',
        'auto-enable-email': 'Đã bật thông báo Email',
        'room1-title': 'Phòng 1 - Nhiệt Độ & Độ Ẩm',
        'room2-title': 'Phòng 2 - Nhiệt Độ & Độ Ẩm',
        'room-controls': 'Điều Khiển Phòng',
        'alert-settings': 'Cài Đặt Cảnh Báo',
        'room1-light': 'Đèn Phòng 1',
        'room2-light': 'Đèn Phòng 2',
        'room1-alert': 'Cảnh Báo Phòng 1',
        'room2-alert': 'Cảnh Báo Phòng 2',
        'email-alert': 'Cảnh Báo Email',
        'temp-threshold': 'Ngưỡng Nhiệt Độ:',
        'humidity-threshold': 'Ngưỡng Độ Ẩm:',
        'confirm-thresholds': 'Xác Nhận Ngưỡng',
        'high-humidity': 'Cảnh Báo Độ Ẩm Cao:',
        'threshold': 'Ngưỡng:',
        'warning-title': 'Cảnh báo!',
        'cancel-button': 'Hủy bỏ',
        'confirm-button': 'Vẫn xác nhận',
        'temp-warning': 'Ngưỡng nhiệt độ bạn đặt {condition}. Phạm vi bình thường từ 20°C đến 35°C. Bạn có chắc chắn?',
        'humidity-warning': 'Ngưỡng độ ẩm bạn đặt {condition}. Phạm vi bình thường từ 30% đến 70%. Bạn có chắc chắn?',
        'very-high': 'quá cao',
        'very-low': 'quá thấp'
    }
};

// Current language
let currentLang = localStorage.getItem('language') || 'en';

// Function to toggle language
window.toggleLanguage = function() {
    currentLang = currentLang === 'en' ? 'vi' : 'en';
    localStorage.setItem('language', currentLang);
    updateLanguage();
    
    // Update language toggle button
    const langText = document.querySelector('.lang-text');
    if (langText) {
        langText.textContent = currentLang.toUpperCase();
    }
}

// Function to update all text elements
function updateLanguage() {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
}

// Function to update button state
function updateButtonState(buttonId, isActive) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.classList.toggle('active', isActive);
        const statusSpan = button.querySelector('.button-status');
        if (statusSpan) {
            statusSpan.textContent = isActive ? 'ON' : 'OFF';
        }
    }
}

// Function to toggle room light
function toggleRoomLight(roomId) {
    const buttonId = `${roomId}Light`;
    const button = document.getElementById(buttonId);
    const isActive = !button.classList.contains('active');
    
    devicesRef.child(`${roomId}/light`).set({
        status: isActive,
        lastUpdated: new Date().toISOString()
    });
}

// Function to check if all alerts are disabled
function areAllAlertsDisabled() {
    const room1Alert = document.getElementById('room1Alert');
    const room2Alert = document.getElementById('room2Alert');
    const emailAlert = document.getElementById('emailAlert');
    
    return !room1Alert.classList.contains('active') && 
           !room2Alert.classList.contains('active') && 
           !emailAlert.classList.contains('active');
}

// Function to enable all alerts
function enableAllAlerts() {
    const updates = {
        'room1/enabled': true,
        'room2/enabled': true,
        'email/enabled': true
    };
    
    alertsRef.update(updates).then(() => {
        const message = currentLang === 'en' 
            ? 'Alerts have been automatically re-enabled for safety'
            : 'Cảnh báo đã được tự động bật lại để đảm bảo an toàn';
        showToast(message);
    });
}

// Individual timeouts for each alert button
let alertTimeouts = {
    room1: null,
    room2: null,
    email: null
};

// Function to toggle room alert
function toggleRoomAlert(roomId) {
    const buttonId = `${roomId}Alert`;
    const button = document.getElementById(buttonId);
    const isActive = !button.classList.contains('active');
    
    alertsRef.child(`${roomId}/enabled`).set(isActive).then(() => {
        // Clear existing timeout for this specific room if any
        if (alertTimeouts[roomId]) {
            clearTimeout(alertTimeouts[roomId]);
            alertTimeouts[roomId] = null;
        }
        
        // If alert is disabled, start 30-second timer
        if (!isActive) {
            alertTimeouts[roomId] = setTimeout(() => {
                // Re-enable this specific alert
                alertsRef.child(`${roomId}/enabled`).set(true).then(() => {
                    showToast(translations[currentLang][`auto-enable-${roomId}`]);
                });
                alertTimeouts[roomId] = null;
            }, 30000); // 30 seconds
        }
    });
}

// Function to toggle email alert
function toggleEmailAlert() {
    const button = document.getElementById('emailAlert');
    const isActive = !button.classList.contains('active');
    
    alertsRef.child('email/enabled').set(isActive).then(() => {
        // Clear existing timeout for email alert if any
        if (alertTimeouts.email) {
            clearTimeout(alertTimeouts.email);
            alertTimeouts.email = null;
        }
        
        // If alert is disabled, start 30-second timer
        if (!isActive) {
            alertTimeouts.email = setTimeout(() => {
                // Re-enable email alert
                alertsRef.child('email/enabled').set(true).then(() => {
                    showToast(translations[currentLang]['auto-enable-email']);
                });
                alertTimeouts.email = null;
            }, 30000); // 30 seconds
        }
    });
}

// Add cleanup for page unload
window.addEventListener('beforeunload', () => {
    // Clear all alert timeouts
    Object.values(alertTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
    });
});

// Temporary storage for threshold changes
let tempThresholds = {
    room1: { temperature: null, humidity: null },
    room2: { temperature: null, humidity: null }
};

// Threshold validation ranges
const THRESHOLD_RANGES = {
    temperature: { 
        normal: { min: 20, max: 35 },
        warning: { min: 15, max: 45 },
        critical: { min: 0, max: 100 }
    },
    humidity: { 
        normal: { min: 30, max: 70 },
        warning: { min: 20, max: 80 },
        critical: { min: 0, max: 100 }
    }
};

// Store pending threshold change
let pendingThresholdChange = null;

// Function to check threshold severity
function checkThresholdSeverity(type, value) {
    const ranges = THRESHOLD_RANGES[type];
    const numValue = parseFloat(value);

    if (numValue >= ranges.normal.min && numValue <= ranges.normal.max) {
        return 'normal';
    } else if (numValue >= ranges.warning.min && numValue <= ranges.warning.max) {
        return 'warning';
    } else {
        return 'critical';
    }
}

// Function to get warning message
function getWarningMessage(type, value, severity) {
    const ranges = THRESHOLD_RANGES[type];
    const numValue = parseFloat(value);

    if (severity === 'warning') {
        return currentLang === 'en' 
            ? `The ${type} threshold (${value}${type === 'temperature' ? '°C' : '%'}) is outside the normal range (${ranges.normal.min}-${ranges.normal.max}${type === 'temperature' ? '°C' : '%'}). Please confirm if this is intended.`
            : `Ngưỡng ${type === 'temperature' ? 'nhiệt độ' : 'độ ẩm'} (${value}${type === 'temperature' ? '°C' : '%'}) nằm ngoài phạm vi bình thường (${ranges.normal.min}-${ranges.normal.max}${type === 'temperature' ? '°C' : '%'}). Vui lòng xác nhận nếu đây là chủ ý.`;
    } else if (severity === 'critical') {
        return currentLang === 'en'
            ? `Warning: The ${type} threshold (${value}${type === 'temperature' ? '°C' : '%'}) is at a critical level! Normal range is ${ranges.normal.min}-${ranges.normal.max}${type === 'temperature' ? '°C' : '%'}. Are you sure you want to set this value?`
            : `Cảnh báo: Ngưỡng ${type === 'temperature' ? 'nhiệt độ' : 'độ ẩm'} (${value}${type === 'temperature' ? '°C' : '%'}) ở mức nguy hiểm! Phạm vi bình thường là ${ranges.normal.min}-${ranges.normal.max}${type === 'temperature' ? '°C' : '%'}. Bạn có chắc chắn muốn đặt giá trị này?`;
    }
    return '';
}

// Function to show confirmation modal
function showConfirmationModal(message) {
    console.log('Showing modal with message:', message); // Debug log
    const modal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('modalMessage');
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.classList.add('show');
        console.log('Modal elements found and updated'); // Debug log
    } else {
        console.log('Modal elements not found'); // Debug log
    }
}

// Function to hide confirmation modal
function hideConfirmationModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('show');
}

// Function to update threshold display only
window.updateThresholdDisplay = function(roomId, type, value) {
    const roomNumber = roomId.slice(-1);
    const valueElement = document.getElementById(`${type}ThresholdValue${roomNumber}`);
    if (valueElement) {
        valueElement.textContent = `${value}${type === 'temperature' ? '°C' : '%'}`;
    }
}

// Function to confirm threshold changes
window.confirmThresholds = function(roomId) {
    // Get current values from sliders
    const tempValue = parseFloat(document.getElementById(`tempThreshold${roomId.slice(-1)}`).value);
    const humidityValue = parseFloat(document.getElementById(`humidityThreshold${roomId.slice(-1)}`).value);
    
    // Check temperature threshold
    let warningMessages = [];
    
    if (tempValue < 25 || tempValue > 45) {
        const message = currentLang === 'en'
            ? `Temperature threshold (${tempValue}°C) is ${tempValue < 25 ? 'too low' : 'too high'}. Normal range is 25°C - 45°C.`
            : `Ngưỡng nhiệt độ (${tempValue}°C) ${tempValue < 25 ? 'quá thấp' : 'quá cao'}. Phạm vi bình thường là 25°C - 45°C.`;
        warningMessages.push(message);
    }
    
    // Check humidity threshold
    if (humidityValue < 40 || humidityValue > 80) {
        const message = currentLang === 'en'
            ? `Humidity threshold (${humidityValue}%) is ${humidityValue < 40 ? 'too low' : 'too high'}. Normal range is 40% - 80%.`
            : `Ngưỡng độ ẩm (${humidityValue}%) ${humidityValue < 40 ? 'quá thấp' : 'quá cao'}. Phạm vi bình thường là 40% - 80%.`;
        warningMessages.push(message);
    }
    
    // If there are warnings, show confirmation modal
    if (warningMessages.length > 0) {
        const warningMessage = warningMessages.join('\n\n');
        pendingThresholdChange = {
            roomId,
            temperature: tempValue,
            humidity: humidityValue
        };
        showConfirmationModal(warningMessage);
        return;
    }
    
    // If no warnings, update values directly
    updateThresholds(roomId, tempValue, humidityValue);
}

// Function to update thresholds in Firebase
function updateThresholds(roomId, tempValue, humidityValue) {
    const updates = {
        [`thresholds/${roomId}/temperature`]: {
            value: tempValue,
            lastUpdated: new Date().toISOString()
        },
        [`thresholds/${roomId}/humidity`]: {
            value: humidityValue,
            lastUpdated: new Date().toISOString()
        }
    };
    
    database.ref().update(updates).then(() => {
        showToast();
    }).catch(error => {
        console.error('Error updating thresholds:', error);
    });
}

// Function to handle threshold change confirmation
window.confirmThresholdChange = function() {
    if (pendingThresholdChange) {
        const { roomId, temperature, humidity } = pendingThresholdChange;
        updateThresholds(roomId, temperature, humidity);
    }
    hideConfirmationModal();
    pendingThresholdChange = null;
}

// Function to handle threshold change cancellation
window.cancelThresholdChange = function() {
    if (pendingThresholdChange) {
        const { roomId } = pendingThresholdChange;
        const roomNumber = roomId.slice(-1);
        
        // Reset sliders to previous values
        database.ref(`thresholds/${roomId}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const tempSlider = document.getElementById(`tempThreshold${roomNumber}`);
                const tempDisplay = document.getElementById(`tempThresholdValue${roomNumber}`);
                const humiditySlider = document.getElementById(`humidityThreshold${roomNumber}`);
                const humidityDisplay = document.getElementById(`humidityThresholdValue${roomNumber}`);
                
                if (data.temperature && tempSlider && tempDisplay) {
                    tempSlider.value = data.temperature.value;
                    tempDisplay.textContent = `${data.temperature.value}°C`;
                }
                
                if (data.humidity && humiditySlider && humidityDisplay) {
                    humiditySlider.value = data.humidity.value;
                    humidityDisplay.textContent = `${data.humidity.value}%`;
                }
            }
        });
    }
    hideConfirmationModal();
    pendingThresholdChange = null;
}

// Function to show toast notification
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (message) {
        toast.textContent = message;
    } else {
        toast.textContent = currentLang === 'en' ? 'Thresholds updated successfully!' : 'Đã cập nhật ngưỡng thành công!';
    }
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Function to show temperature alert
function showTemperatureAlert(temperature, roomNumber) {
    const alertStatus = document.getElementById(`alertStatus${roomNumber}`);
    if (alertStatus) {
        // Get threshold value from Firebase
        database.ref(`thresholds/room${roomNumber}/temperature`).once('value', (snapshot) => {
            const threshold = snapshot.val()?.value || 30;
            let alertMessage = '';
            
            if (temperature > threshold) {
                alertMessage = currentLang === 'en' 
                    ? `⚠️ High Temperature Alert: ${temperature.toFixed(1)}°C (${translations[currentLang]['threshold']} ${threshold}°C)`
                    : `⚠️ Cảnh Báo Nhiệt Độ Cao: ${temperature.toFixed(1)}°C (${translations[currentLang]['threshold']} ${threshold}°C)`;
            }

            // Get current humidity alert
            database.ref(`sensors/room${roomNumber}/humidity`).once('value', (humiditySnapshot) => {
                const currentHumidity = humiditySnapshot.val();
                if (currentHumidity) {
                    database.ref(`thresholds/room${roomNumber}/humidity`).once('value', (humidityThresholdSnapshot) => {
                        const humidityThreshold = humidityThresholdSnapshot.val()?.value || 80;
                        if (currentHumidity > humidityThreshold) {
                            if (alertMessage) alertMessage += '\n\n';  // Add extra newline for spacing
                            alertMessage += currentLang === 'en'
                                ? `⚠️ ${translations[currentLang]['high-humidity']} ${currentHumidity.toFixed(1)}% (${translations[currentLang]['threshold']} ${humidityThreshold}%)`
                                : `⚠️ ${translations[currentLang]['high-humidity']} ${currentHumidity.toFixed(1)}% (${translations[currentLang]['threshold']} ${humidityThreshold}%)`;
                        }
                        
                        if (alertMessage) {
                            alertStatus.textContent = alertMessage;
                            alertStatus.classList.add('active');
                        } else {
                            alertStatus.classList.remove('active');
                            alertStatus.textContent = '';
                        }
                    });
                } else {
                    if (alertMessage) {
                        alertStatus.textContent = alertMessage;
                        alertStatus.classList.add('active');
                    } else {
                        alertStatus.classList.remove('active');
                        alertStatus.textContent = '';
                    }
                }
            });
        });
    }
}

// Function to show humidity alert
function showHumidityAlert(humidity, roomNumber) {
    const alertStatus = document.getElementById(`alertStatus${roomNumber}`);
    if (alertStatus) {
        // Get threshold value from Firebase
        database.ref(`thresholds/room${roomNumber}/humidity`).once('value', (snapshot) => {
            const threshold = snapshot.val()?.value || 80;
            let alertMessage = '';
            
            if (humidity > threshold) {
                alertMessage = currentLang === 'en' 
                    ? `⚠️ ${translations[currentLang]['high-humidity']} ${humidity.toFixed(1)}% (${translations[currentLang]['threshold']} ${threshold}%)`
                    : `⚠️ ${translations[currentLang]['high-humidity']} ${humidity.toFixed(1)}% (${translations[currentLang]['threshold']} ${threshold}%)`;
            }

            // Get current temperature alert
            database.ref(`sensors/room${roomNumber}/temperature`).once('value', (tempSnapshot) => {
                const currentTemp = tempSnapshot.val();
                if (currentTemp) {
                    database.ref(`thresholds/room${roomNumber}/temperature`).once('value', (tempThresholdSnapshot) => {
                        const tempThreshold = tempThresholdSnapshot.val()?.value || 30;
                        if (currentTemp > tempThreshold) {
                            if (alertMessage) alertMessage = currentLang === 'en'
                                ? `⚠️ High Temperature Alert: ${currentTemp.toFixed(1)}°C (${translations[currentLang]['threshold']} ${tempThreshold}°C)\n\n${alertMessage}`
                                : `⚠️ Cảnh Báo Nhiệt Độ Cao: ${currentTemp.toFixed(1)}°C (${translations[currentLang]['threshold']} ${tempThreshold}°C)\n\n${alertMessage}`;
                            else alertMessage = currentLang === 'en'
                                ? `⚠️ High Temperature Alert: ${currentTemp.toFixed(1)}°C (${translations[currentLang]['threshold']} ${tempThreshold}°C)`
                                : `⚠️ Cảnh Báo Nhiệt Độ Cao: ${currentTemp.toFixed(1)}°C (${translations[currentLang]['threshold']} ${tempThreshold}°C)`;
                        }
                        
                        if (alertMessage) {
                            alertStatus.textContent = alertMessage;
                            alertStatus.classList.add('active');
                        } else {
                            alertStatus.classList.remove('active');
                            alertStatus.textContent = '';
                        }
                    });
                } else {
                    if (alertMessage) {
                        alertStatus.textContent = alertMessage;
                        alertStatus.classList.add('active');
                    } else {
                        alertStatus.classList.remove('active');
                        alertStatus.textContent = '';
                    }
                }
            });
        });
    }
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...'); // Debug log
    
    // Initialize tempThresholds
    tempThresholds = {
        room1: { temperature: null, humidity: null },
        room2: { temperature: null, humidity: null }
    };

    // Update language
    updateLanguage();
    const langText = document.querySelector('.lang-text');
    if (langText) {
        langText.textContent = currentLang.toUpperCase();
    }

    // Add input event listeners for threshold sliders
    ['1', '2'].forEach(roomNum => {
        const tempSlider = document.getElementById(`tempThreshold${roomNum}`);
        const humiditySlider = document.getElementById(`humidityThreshold${roomNum}`);

        if (tempSlider) {
            console.log(`Setting up temperature slider for room ${roomNum}`); // Debug log
            tempSlider.addEventListener('input', function() {
                console.log(`Temperature slider value changed: ${this.value}`); // Debug log
                updateThresholdDisplay(`room${roomNum}`, 'temperature', this.value);
            });
        }

        if (humiditySlider) {
            console.log(`Setting up humidity slider for room ${roomNum}`); // Debug log
            humiditySlider.addEventListener('input', function() {
                console.log(`Humidity slider value changed: ${this.value}`); // Debug log
                updateThresholdDisplay(`room${roomNum}`, 'humidity', this.value);
            });
        }
    });
});

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRuYjFavXfLkTiGYmDcyEgfiiyJCztgfI",
    authDomain: "smart-ebaf3.firebaseapp.com",
    databaseURL: "https://smart-ebaf3-default-rtdb.firebaseio.com",
    projectId: "smart-ebaf3",
    storageBucket: "smart-ebaf3.firebasestorage.app",
    messagingSenderId: "83600308706",
    appId: "1:83600308706:web:98df807e926ab4dff7a1bb"
  };
  

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// References
const devicesRef = database.ref('devices');
const sensorsRef = database.ref('sensors');
const alertsRef = database.ref('alerts');

// Temperature alert threshold
const TEMP_THRESHOLD = 30; // 30°C

// Listen for changes in devices
devicesRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.room1?.light) {
            updateButtonState('room1Light', data.room1.light.status);
        }
        if (data.room2?.light) {
            updateButtonState('room2Light', data.room2.light.status);
        }
    }
});

// Listen for changes in sensors
sensorsRef.on('value', updateSensorValues);

// Listen for changes in alerts
alertsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.room1) {
            updateButtonState('room1Alert', data.room1.enabled);
        }
        if (data.room2) {
            updateButtonState('room2Alert', data.room2.enabled);
        }
        if (data.email) {
            updateButtonState('emailAlert', data.email.enabled);
        }
    }
});

// Add sample data if none exists
devicesRef.once('value', (snapshot) => {
    if (!snapshot.exists()) {
        devicesRef.set({
            room1: {
                light: {
                    status: false,
                    lastUpdated: new Date().toISOString()
                }
            },
            room2: {
                light: {
                    status: false,
                    lastUpdated: new Date().toISOString()
                }
            }
        });
    }
});

// Add sample sensor data if none exists
sensorsRef.once('value', (snapshot) => {
    if (!snapshot.exists()) {
        sensorsRef.set({
            room1: {
                temperature: 25.5,
                humidity: 60.0,
                lastUpdated: new Date().toISOString()
            },
            room2: {
                temperature: 26.0,
                humidity: 65.0,
                lastUpdated: new Date().toISOString()
            }
        });
    }
});

// Add sample alert settings if none exists
alertsRef.once('value', (snapshot) => {
    if (!snapshot.exists()) {
        alertsRef.set({
            room1: {
                enabled: false,
                lastUpdated: new Date().toISOString()
            },
            room2: {
                enabled: false,
                lastUpdated: new Date().toISOString()
            },
            email: {
                enabled: false,
                lastUpdated: new Date().toISOString()
            }
        });
    }
});

// Add threshold update function
window.updateThreshold = function(roomId, type, value) {
    const valueElement = document.getElementById(`${type}ThresholdValue${roomId.slice(-1)}`);
    if (valueElement) {
        valueElement.textContent = `${value}${type === 'temperature' ? '°C' : '%'}`;
    }
    
    // Update in Firebase
    const thresholdRef = database.ref(`thresholds/${roomId}/${type}`);
    thresholdRef.set({
        value: parseFloat(value),
        lastUpdated: new Date().toISOString()
    });
}

// Add threshold listeners
database.ref('thresholds').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Update Room 1
        if (data.room1) {
            if (data.room1.temperature) {
                const tempSlider = document.getElementById('tempThreshold1');
                const tempValue = document.getElementById('tempThresholdValue1');
                if (tempSlider) {
                    tempSlider.value = data.room1.temperature.value;
                    tempThresholds.room1.temperature = data.room1.temperature.value;
                }
                if (tempValue) tempValue.textContent = `${data.room1.temperature.value}°C`;
                
                // Update alerts when threshold changes
                database.ref('sensors/room1/temperature').once('value', (tempSnapshot) => {
                    const currentTemp = tempSnapshot.val();
                    if (currentTemp) {
                        showTemperatureAlert(currentTemp, 1);
                    }
                });
            }
            if (data.room1.humidity) {
                const humiditySlider = document.getElementById('humidityThreshold1');
                const humidityValue = document.getElementById('humidityThresholdValue1');
                if (humiditySlider) {
                    humiditySlider.value = data.room1.humidity.value;
                    tempThresholds.room1.humidity = data.room1.humidity.value;
                }
                if (humidityValue) humidityValue.textContent = `${data.room1.humidity.value}%`;
                
                // Update alerts when threshold changes
                database.ref('sensors/room1/humidity').once('value', (humiditySnapshot) => {
                    const currentHumidity = humiditySnapshot.val();
                    if (currentHumidity) {
                        showHumidityAlert(currentHumidity, 1);
                    }
                });
            }
        }
        
        // Update Room 2
        if (data.room2) {
            if (data.room2.temperature) {
                const tempSlider = document.getElementById('tempThreshold2');
                const tempValue = document.getElementById('tempThresholdValue2');
                if (tempSlider) {
                    tempSlider.value = data.room2.temperature.value;
                    tempThresholds.room2.temperature = data.room2.temperature.value;
                }
                if (tempValue) tempValue.textContent = `${data.room2.temperature.value}°C`;
                
                // Update alerts when threshold changes
                database.ref('sensors/room2/temperature').once('value', (tempSnapshot) => {
                    const currentTemp = tempSnapshot.val();
                    if (currentTemp) {
                        showTemperatureAlert(currentTemp, 2);
                    }
                });
            }
            if (data.room2.humidity) {
                const humiditySlider = document.getElementById('humidityThreshold2');
                const humidityValue = document.getElementById('humidityThresholdValue2');
                if (humiditySlider) {
                    humiditySlider.value = data.room2.humidity.value;
                    tempThresholds.room2.humidity = data.room2.humidity.value;
                }
                if (humidityValue) humidityValue.textContent = `${data.room2.humidity.value}%`;
                
                // Update alerts when threshold changes
                database.ref('sensors/room2/humidity').once('value', (humiditySnapshot) => {
                    const currentHumidity = humiditySnapshot.val();
                    if (currentHumidity) {
                        showHumidityAlert(currentHumidity, 2);
                    }
                });
            }
        }
    }
});

// Add sample threshold data if none exists
database.ref('thresholds').once('value', (snapshot) => {
    if (!snapshot.exists()) {
        database.ref('thresholds').set({
            room1: {
                temperature: {
                    value: 30,
                    lastUpdated: new Date().toISOString()
                },
                humidity: {
                    value: 80,
                    lastUpdated: new Date().toISOString()
                }
            },
            room2: {
                temperature: {
                    value: 30,
                    lastUpdated: new Date().toISOString()
                },
                humidity: {
                    value: 80,
                    lastUpdated: new Date().toISOString()
                }
            }
        });
    }
});

// Function to update sensor values
function updateSensorValues(snapshot) {
    const data = snapshot.val();
    if (data) {
        // Update Room 1
        if (data.room1) {
            const tempElement1 = document.getElementById('temperature1');
            const humidityElement1 = document.getElementById('humidity1');
            if (tempElement1) tempElement1.textContent = data.room1.temperature ? data.room1.temperature.toFixed(1) : '--';
            if (humidityElement1) humidityElement1.textContent = data.room1.humidity ? data.room1.humidity.toFixed(1) : '--';
            
            // Update alerts immediately when sensor values change
            if (data.room1.temperature) {
                showTemperatureAlert(data.room1.temperature, 1);
            }
            if (data.room1.humidity) {
                showHumidityAlert(data.room1.humidity, 1);
            }
        }

        // Update Room 2
        if (data.room2) {
            const tempElement2 = document.getElementById('temperature2');
            const humidityElement2 = document.getElementById('humidity2');
            if (tempElement2) tempElement2.textContent = data.room2.temperature ? data.room2.temperature.toFixed(1) : '--';
            if (humidityElement2) humidityElement2.textContent = data.room2.humidity ? data.room2.humidity.toFixed(1) : '--';
            
            // Update alerts immediately when sensor values change
            if (data.room2.temperature) {
                showTemperatureAlert(data.room2.temperature, 2);
            }
            if (data.room2.humidity) {
                showHumidityAlert(data.room2.humidity, 2);
            }
        }
    }
}