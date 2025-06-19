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

    counter = 0
    feedback=""
    stage="Standing"
    s=""
    wrong_set = set()

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
            knee_angle = calculate_angle(lhip, lknee, lankle)

           
            if torso_angle > 45 and stage==" down":
                feedback=f"You needed to strigten your back at count {counter}\n"
                wrong_set.add(feedback)
                cv2.putText(image, "Straighten your back!",
                (int(50 * scale_factor), int(height - 50 * scale_factor)),
                cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

            # Calculate angle
            lhip_angle = calculate_angle(lshoulder, lhip, lknee)
           
            print(f"Torso angle : {torso_angle} .. hip angle: {lhip_angle}.... knee angle :{knee_angle}")
            print("-----------------------------------------------------------------------------")
            if lhip_angle <100 and stage==" Standing":
                stage = " down"
                counter += 1
                print(stage)
            if lhip_angle >=100 and stage != 'good':
                stage = " Standing"
            

                if knee_angle < 60 or knee_angle > 120 and stage==" down":
                    warning = f"Check knee angle at count {counter}"
                    wrong_set.add(warning)
                    cv2.putText(image, "Fix your knees!", (50, 200), cv2.FONT_HERSHEY_SIMPLEX,
                                font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

                if lhip_angle > 100 and stage==" down":
                    warning = f"Not squatting deep enough at count {counter}"
                    wrong_set.add(warning)
                    cv2.putText(image, "Go deeper!", (50, 250), cv2.FONT_HERSHEY_SIMPLEX,
                                font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        
        # cv2.rectangle(image, (0, 0), (225, 73), (1, 117, 16), -1)

        # Rep data
        cv2.putText(image, 'REPS', (int(15 * scale_factor), int(30 * scale_factor)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 255, 0), thickness, cv2.LINE_AA)

        cv2.putText(image, str(counter), (int(10 * scale_factor), int(80 * scale_factor)),
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

    s = f"Total Reps: {counter}. \n"
    print(s)
    return_string= s+ "\n".join(wrong_set)
    return return_string 