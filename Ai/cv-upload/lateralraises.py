import cv2
import mediapipe as mp
import numpy as np
import math


def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def feedback(feedback_count,counter):
    return (feedback_count/(counter*2)) *100;

def process(video_path):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, model_complexity=1)
    mp_drawing = mp.solutions.drawing_utils
    cap = cv2.VideoCapture(video_path)

    counter = 0
    feedback_count=0
    # partial_reps = False
    # angle_history = []
    # reached_up = False
    # reached_down = True


    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        height, width, _ = image.shape
        scale_factor = width / 640
        font_scale_title = 0.5 * scale_factor
        font_scale_value = 2 * scale_factor
        thickness = int(2 * scale_factor)


        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark

           
            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]

            rshoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            relbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            rwrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]


            rhip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                   landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]

            hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]

           

            # Calculate angle
            angle = calculate_angle(hip, shoulder, elbow)

            armAgnle=calculate_angle(shoulder,elbow,wrist)


            rangle = calculate_angle(rhip, rshoulder, relbow)

            rarmAgnle=calculate_angle(rshoulder,relbow,rwrist)


            if angle>90:
                # cv2.putText(image, "please lower your left arm",
                #             (120, 120),
                #             cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                pass
            if rangle>90:
                # cv2.putText(image, "please lower your right arm",
                #             (200, 200),
                #             cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                pass

            if angle <70 and armAgnle>=150 and rangle<70 and rarmAgnle>=150:
                stage = "down"
            if angle >70 and angle<=90 and armAgnle>=150 and rangle>70 and armAgnle>=150 and stage == 'down':
                stage = "up"
                counter += 1
                print(counter)
            if(armAgnle<=150):
                # cv2.putText(image, "please straighten your left arm",
                #             (0, 250),
                #             cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                feedback_count+=1
            if(rarmAgnle<=150):
                # cv2.putText(image, "please straighten your right arm",
                #             (0, 300),
                #             cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                feedback_count+=1
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        
        # cv2.rectangle(image, (0, 0), (225, 73), (1, 117, 16), -1)

        # Rep data
        cv2.putText(image, 'REPS', (int(15 * scale_factor), int(30 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 255, 0), thickness, cv2.LINE_AA)

        cv2.putText(image, str(counter), (int(10 * scale_factor), int(80 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_value, (0, 255, 0), thickness + 1, cv2.LINE_AA)


        # Stage data
        cv2.putText(image, 'STAGE', (int(65 * scale_factor), int(30 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 255, 0), thickness, cv2.LINE_AA)

        cv2.putText(image, stage,
                    (int(60 * scale_factor), int(80 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_value, (0, 255, 0), thickness + 1, cv2.LINE_AA)
        
        image = cv2.resize(image, (800, 600))
        cv2.imshow("Lateral Raises Tracker", image)
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    s = f"Total Reps: {counter}. \n"
    if feedback(feedback_count,counter)>=30:
        s += "you need to straight your arms more \n"
    print(s)
    return s