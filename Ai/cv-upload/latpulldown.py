import cv2
import mediapipe as mp
import numpy as np
import math

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
    bad_posture_detected = False
    angle_history = []
    reached_down = True
    reached_up = False

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if results.pose_landmarks:
            lm = results.pose_landmarks.landmark
            shoulder = [lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                        lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            elbow = [lm[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                     lm[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            wrist = [lm[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                     lm[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]

            # back posture check
            hip = [lm[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                   lm[mp_pose.PoseLandmark.RIGHT_HIP.value].y]

        
            angle = calculate_angle(shoulder, elbow, wrist)
            angle_history.append(angle)
            if len(angle_history) > 2:
                angle_history.pop(0)

            
            if (shoulder[0] - hip[0]) > 0.1:
                bad_posture_detected = True

            
            if len(angle_history) == 2:
                prev_angle, curr_angle = angle_history

                if reached_down and curr_angle < prev_angle:
                    if curr_angle < 70:
                        reached_up = True
                        reached_down = False

                elif reached_up and curr_angle > prev_angle:
                    if curr_angle > 150:
                        rep_count += 1
                        print(f"Rep {rep_count}: Full range of motion")
                        reached_up = False
                        reached_down = True

                else:
                    if not reached_up and curr_angle > prev_angle and prev_angle < 150:
                        partial_reps = True
                    if not reached_down and curr_angle < prev_angle and prev_angle > 70:
                        partial_reps = True

            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    
        cv2.putText(image, f'Reps: {rep_count}', (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("Lat Pulldown Tracker", image)
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    
    s = f"Total Reps: {rep_count}\n"
    if partial_reps:
        s += "Warning: You performed partial reps.\n"
    if bad_posture_detected:
        s += "Warning: Detected excessive leaning backward.\n"
    print(s)
    return s
