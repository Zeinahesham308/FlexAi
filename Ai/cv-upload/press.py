import cv2
import mediapipe as mp
import numpy as np

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def process(video_path):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, model_complexity=1)
    mp_drawing = mp.solutions.drawing_utils
    cap = cv2.VideoCapture(video_path)

    rep_count = 0
    partial_reps = False
    angle_history = []
    reached_down = True
    reached_up = False
    arm_not_straight = False
    stage = "down"


    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]

            angle = calculate_angle(shoulder, elbow, wrist)
            angle_history.append(angle)
            if len(angle_history) > 2:
                angle_history.pop(0)
            else:
                angle2 = calculate_angle(shoulder, elbow, hip)
                if angle2 > 100:
                    arm_not_straight=True
                    

            if len(angle_history) == 2:
                prev_angle, curr_angle = angle_history
                if reached_up and curr_angle < prev_angle:
                    if curr_angle < 40:
                        reached_down = True
                        reached_up = False
                        stage = "down"
                
                elif reached_down and curr_angle > prev_angle:
                    if curr_angle > 160:
                        rep_count += 1
                        print(f"Rep {rep_count}")
                        reached_down = False
                        reached_up = True
                        stage = "up"
                
                else:
                    if not reached_down and curr_angle > prev_angle and curr_angle > 40 and curr_angle < 160:
                        partial_reps = True
                    if not reached_up and curr_angle < prev_angle and curr_angle > 40 and curr_angle < 160:
                        partial_reps = True
            
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

        cv2.putText(image, f'Reps: {rep_count}', (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(image, f'stage: {stage:.2f}', (10, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("shoulder press Tracker", image)
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()

    s = f"Total Presses: {rep_count}. \n"
    if arm_not_straight:
        s += "Do not flare out your arms too much. \n"
    print(s)
    return s
