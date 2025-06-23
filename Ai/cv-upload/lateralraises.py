import cv2
import mediapipe as mp
import numpy as np
import math
import pandas as pd

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


    rep_count=0
    feedback=False
    partial_reps = False
    angle_history = []
    reached_up = False
    reached_down = True
    mymax1=0
    mymax2=0
    stage="down"

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        height, width, _ = image.shape

    # Ensure the image is square before sending to MediaPipe
        if height != width:
            diff = abs(height - width)
            if height < width:
                pad_top = diff // 2
                pad_bottom = diff - pad_top
                image = cv2.copyMakeBorder(image, pad_top, pad_bottom, 0, 0, cv2.BORDER_CONSTANT)
            else:
                pad_left = diff // 2
                pad_right = diff - pad_left
                image = cv2.copyMakeBorder(image, 0, 0, pad_left, pad_right, cv2.BORDER_CONSTANT)
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
            shoulderAngle = calculate_angle(hip, shoulder, elbow)

            elbowAgnle=calculate_angle(shoulder,elbow,wrist)


            angle_history.append(shoulderAngle)
            if len(angle_history) > 2:
                angle_history.pop(0)

            
            if len(angle_history) == 2:
                prev_angle, curr_angle = angle_history
                if reached_down and curr_angle > prev_angle:
                    if curr_angle >=95:
                        reached_up = True
                        reached_down = False
                        stage=" up"

                elif reached_up and curr_angle < prev_angle:
                    if curr_angle <30:
                        rep_count += 1
                        print(f"Rep {rep_count}: Full range of motion")
                        reached_up = False
                        reached_down = True
                        stage=" down"

                else :
                    if not reached_up  and curr_angle+5 < prev_angle and prev_angle >=30 and prev_angle<95: #wehn moving up
                        partial_reps = True
                        
                        cv2.putText(image, f"Partial rep DETECTED!!",
                        (int(50 * scale_factor), int(height - 50 * scale_factor)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)
                        mymax1=max(mymax1,abs(prev_angle-curr_angle))
                        

                    if not reached_down  and curr_angle > prev_angle+5 and  prev_angle>30 and partial_reps<95: #wehn moving down
                        partial_reps = True
                        
                        
                        cv2.putText(image, f"Partial rep DETECTED!!",
                        (int(50 * scale_factor), int(height - 50 * scale_factor)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

                        mymax2=max(mymax2,abs(curr_angle-prev_angle))

            print(f"left Shoulder Angle : {shoulderAngle} .. left elbow Angle: {elbowAgnle}")
            print("-----------------------------------------------------------------------------")

            if shoulderAngle>95 :
                cv2.putText(image, f"Please lower your arms",
                        (int(50 * scale_factor), int(height - 50 * scale_factor)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)
                feedback=True

            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        
        # cv2.rectangle(image, (0, 0), (225, 73), (1, 117, 16), -1)

        # Rep data
        cv2.putText(image, 'REPS', (int(15 * scale_factor), int(30 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 255, 0), thickness, cv2.LINE_AA)

        cv2.putText(image, str(rep_count), (int(10 * scale_factor), int(80 * scale_factor)),
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
    
    s = f"Total Reps: {rep_count}. \n"
    if feedback:
        return_string=s+ "You need to lower your arms"
    elif partial_reps:
        return_string=s+"Partial Rep Detected\n"

    return return_string
