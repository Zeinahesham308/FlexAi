import cv2
import mediapipe as mp
import numpy as np
import math


mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, model_complexity=1)
mp_drawing = mp.solutions.drawing_utils


def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

cap = cv2.VideoCapture(0)

rep_count = 0
direction = 0  # 0 -> down, 1 -> up
min_angle = 180
max_angle = 0
invalid_reps = 0
swinging_reps = 0
partial_reps = 0
torso_movements = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                    landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                 landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
        wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                 landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
        hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
               landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
        angle = calculate_angle(shoulder, elbow, wrist)

        max_angle = max(max_angle, angle)
        min_angle = min(min_angle, angle)
        if angle > 160:
            if direction == 1:
                rep_count += 1
                direction = 0
        if angle < 50:
            direction = 1

        # swing detection
        torso_y = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
        torso_movements.append(torso_y)
        if len(torso_movements) > 10:
            delta = max(torso_movements) - min(torso_movements)
            if delta > 0.08:
                swinging_reps += 1
                print(f"[Rep {rep_count+1}] ⚠️ Swinging detected! Torso Y movement: {delta:.3f}")
            torso_movements.pop(0)
        mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    
    cv2.putText(image, f'Reps: {rep_count}', (10, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow("Bicep Curl Tracker", image)
    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

print("\n=== SUMMARY ===")
print(f"Total Reps: {rep_count}")
print(f"Incomplete Reps: {invalid_reps}")
print(f"Swinging Reps: {swinging_reps}")
