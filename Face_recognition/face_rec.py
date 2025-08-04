import cv2
import face_recognition
import RPi.GPIO as GPIO
import pickle
import time

# Khởi tạo GPIO
RELAY_PIN = 17
GPIO.setmode(GPIO.BCM)
GPIO.setup(RELAY_PIN, GPIO.OUT)
GPIO.output(RELAY_PIN, GPIO.LOW)

# Tải dữ liệu nhận diện khuôn mặt
print("[INFO] Đang tải dữ liệu khuôn mặt...")
data = pickle.loads(open("encodings.pickle", "rb").read())

# Mở camera
print("[INFO] Khởi động camera...")
vs = cv2.VideoCapture(0)

# Biến điều khiển thời gian mở khóa
unlock_time = 0
unlocked = False

try:
    while True:
        ret, frame = vs.read()
        if not ret:
            break

        small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
        rgb = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        # Phát hiện và mã hóa khuôn mặt
        boxes = face_recognition.face_locations(rgb)
        encodings = face_recognition.face_encodings(rgb, boxes)

        names = []
        for encoding in encodings:
            # So sánh khoảng cách với các khuôn mặt đã biết
            distances = face_recognition.face_distance(data["encodings"], encoding)
            min_distance = min(distances)

            if min_distance < 0.45:  # Ngưỡng nhận diện (có thể chỉnh: 0.35–0.45)
                best_match_index = distances.tolist().index(min_distance)
                name = data["names"][best_match_index]
            else:
                name = "Unknown"

            names.append(name)

        current_time = time.time()

        # Điều khiển relay nếu nhận diện được khuôn mặt hợp lệ
        if "Unknown" not in names and len(names) > 0:
            if not unlocked:
                print("[INFO] Nhận diện:", names)
                GPIO.output(RELAY_PIN, GPIO.HIGH)
                unlock_time = current_time
                unlocked = True
        else:
            if unlocked and current_time - unlock_time >= 10:
                print("[INFO] Khóa đã đóng lại sau 10 giây")
                GPIO.output(RELAY_PIN, GPIO.LOW)
                unlocked = False

        # Hiển thị khung khuôn mặt và tên
        for ((top, right, bottom, left), name) in zip(boxes, names):
            top *= 2
            right *= 2
            bottom *= 2
            left *= 2
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX,
                        0.5, (0, 255, 0), 2)

        cv2.imshow("Face Recognition", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

except KeyboardInterrupt:
    print("Đã dừng bởi người dùng")

finally:
    vs.release()
    cv2.destroyAllWindows()
    GPIO.output(RELAY_PIN, GPIO.LOW)
    GPIO.cleanup()
