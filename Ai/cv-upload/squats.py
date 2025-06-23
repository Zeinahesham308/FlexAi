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
def torso_angle_with_vertical(shoulder, hip):
    torso_vec = np.array([shoulder[0] - hip[0], shoulder[1] - hip[1]])
    vertical_vec = np.array([0, -1])  # Upward vertical (Y decreases up)
    
    # Normalize both
    torso_vec_norm = torso_vec / np.linalg.norm(torso_vec)
    vertical_vec_norm = vertical_vec / np.linalg.norm(vertical_vec)
    
    # Compute angle (in degrees)
    dot_product = np.dot(torso_vec_norm, vertical_vec_norm)
    angle_rad = np.arccos(np.clip(dot_product, -1.0, 1.0))
    angle_deg = np.degrees(angle_rad)
    
    return angle_deg



def process(video_path):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, model_complexity=1)
    mp_drawing = mp.solutions.drawing_utils
    cap = cv2.VideoCapture(video_path)
    rep_count=0
    counter = 0
    
    stage="Standing"
    s=""

    Starighten_flag=False
    partial_reps=False
    angle_hip_history = []

    squatting = False
    Standing = True
    return_string=""



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

           
            lshoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]

            lhip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y
                    ]

            lknee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y
                     ]
            lankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
              landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]

           
            # torso_angle= calculate_angle(lshoulder, lhip, lankle)
            torso_angle = torso_angle_with_vertical(lshoulder, lhip)


           
            if torso_angle > 45 and stage==" down":
                Starighten_flag=True
                cv2.putText(image, "Straighten your back!",
                (int(80 * scale_factor), int(height - 50 * scale_factor)),
                cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)
                

            # Calculate angle
            lhip_angle = calculate_angle(lshoulder, lhip, lknee)
            angle_hip_history.append(lhip_angle)

            if len(angle_hip_history) > 2:
                angle_hip_history.pop(0)

            
            if len(angle_hip_history) == 2:
                prev_angle, curr_angle = angle_hip_history
                if Standing and curr_angle < prev_angle:
                    if curr_angle <115:
                        squatting = True
                        Standing = False
                        stage=" down"

                elif squatting and curr_angle > prev_angle:
                    if curr_angle >=150:
                        rep_count += 1
                        print(f"Rep {rep_count}: Full range of motion")
                        squatting = False
                        Standing = True
                        stage=" Standing"

                else :
                    if not squatting and curr_angle > prev_angle and prev_angle >115 and prev_angle<150: #wehn moving up
                        partial_reps = True
                        
                        cv2.putText(image, f"Partial rep DETECTED!!",
                        (int(50 * scale_factor), int(height - 50 * scale_factor)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

                    if not Standing and curr_angle < prev_angle and prev_angle < 150 and prev_angle>115:
                        partial_reps = True

                        cv2.putText(image, f"Partial rep DETECTED!!",
                        (int(50 * scale_factor), int(height - 50 * scale_factor)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

                


            print(f"Torso angle : {torso_angle} .. hip angle: {lhip_angle}")
            print("-----------------------------------------------------------------------------")
        # cv2.rectangle(image, (0, 0), (225, 73), (1, 117, 16), -1)

        # Rep data
        cv2.putText(image, 'REPS', (int(15 * scale_factor), int(30 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 255, 0), thickness, cv2.LINE_AA)

        cv2.putText(image, str(rep_count), (int(10 * scale_factor), int(80 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_value, (0, 255, 0), thickness + 1, cv2.LINE_AA)


        # Stage data
        cv2.putText(image, ' STAGE', (int(65 * scale_factor), int(30 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 255, 0), thickness, cv2.LINE_AA)

        cv2.putText(image, stage,
                    (int(60 * scale_factor), int(80 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_value, (0, 255, 0), thickness + 1, cv2.LINE_AA)
        
        #image = cv2.resize(image, (800, 600))
        cv2.imshow("Squats Tracker", image)
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    s = f"Total Reps: {rep_count}. \n"
    print(s)
    return_string+=s
    if Starighten_flag:
        return_string+="Don't lean forward"
        return return_string
    elif partial_reps:
        return_string+="Partial Rep Detected"
        return return_string
    return return_string 
