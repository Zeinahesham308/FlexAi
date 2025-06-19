import cv2
import mediapipe as mp
import numpy as np
import math
threshold_deg=30
mymax=0
def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle
def is_vertical(shoulder, elbow, threshold_deg=40):
    global mymax
    dx = elbow[0] - shoulder[0]
    dy = shoulder[1] - elbow[1]  # Y decreases going up
    angle_rad = np.arctan2(dx, dy)  # dx over dy to check deviation from vertical
    angle_deg = np.degrees(abs(angle_rad))
    print(angle_deg)
    mymax=max(mymax,angle_deg)
    return angle_deg < threshold_deg  # within allowed lean



def process(video_path):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, model_complexity=1)
    mp_drawing = mp.solutions.drawing_utils
    cap = cv2.VideoCapture(video_path)

    counter = 0
    feedback=""
    stage="up"
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
            lelbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            lwrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            lhip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]

           
            # torso_angle= calculate_angle(lshoulder, lhip, lankle)
            elbow_angle = calculate_angle(lshoulder, lelbow, lwrist)
            shoulder_angle = calculate_angle(lhip, lshoulder, lelbow)

             # Repetition logic
            if elbow_angle <=80 and stage == "up":
                stage = "down"
                counter += 1
                print("Repetition:", counter)

            if elbow_angle >=150 and stage == "down":
                stage = "up"


            # Feedback
            if elbow_angle>80 and elbow_angle<130 and stage=="up":
                print("REALLY ? ")
                feedback = f"Bend your elbow more at count {counter}"
                wrong_set.add(feedback)
                cv2.putText(image, "Bend your elbow more!",
                            (50, 200), cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

        
            # if elbow_angle > 80 and stage == "down":
            #     feedback = f"Bend your elbow more at count {counter}"
            #     wrong_set.add(feedback)
            #     cv2.putText(image, "Bend your elbow more!",
            #                 (50, 200), cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)

            # if shoulder_angle < 60:
            #     feedback = f"Keep arm more vertical at count {counter}"
            #     wrong_set.add(feedback)
            #     cv2.putText(image, "Keep arm vertical!",
            #                 (50, 250), cv2.FONT_HERSHEY_SIMPLEX, font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)
           
           
            vertical_ok = is_vertical(lshoulder, lelbow)
            if not vertical_ok:
                warning = f"Arm not vertical at count {counter}"
                wrong_set.add(warning)
                cv2.putText(image, "Keep your upper arm vertical!",
                            (50, 300), cv2.FONT_HERSHEY_SIMPLEX,
                            font_scale_title, (0, 0, 255), thickness, cv2.LINE_AA)


            print(f"Elbow angle : {elbow_angle} .. Shoulder angle: {shoulder_angle}")
            print("-----------------------------------------------------------------------------")
           

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
        cv2.imshow("Overhead Extension Tracker", image)
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    s = f"Total Reps: {counter}. \n"
    print(s)
    print(f"MAX :{mymax}")
    return_string= s+ "\n".join(wrong_set)
    return return_string 