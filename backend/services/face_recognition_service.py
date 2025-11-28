import pickle
import json
from typing import List, Tuple, Optional, Dict
from pathlib import Path
import logging
import numpy as np

# Optional AI imports - gracefully handle if not installed
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logging.warning("OpenCV not installed. Face detection features will be limited.")

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    logging.warning("face_recognition not installed. Install with: pip install -r requirements-ai.txt")

try:
    from mtcnn import MTCNN
    MTCNN_AVAILABLE = True
except ImportError:
    MTCNN_AVAILABLE = False
    logging.warning("MTCNN not installed.")

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    logging.warning("DeepFace not installed.")

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    """
    Advanced face detection and recognition service supporting multiple algorithms
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.face_detection_confidence = float(self.config.get('face_detection_confidence', 0.7))
        self.face_recognition_tolerance = float(self.config.get('face_recognition_tolerance', 0.6))
        self.face_model = self.config.get('face_model', 'hog')  # hog or cnn
        self.encoding_model = self.config.get('encoding_model', 'large')  # small or large
        
        # Initialize MTCNN detector if available
        if MTCNN_AVAILABLE:
            try:
                self.mtcnn_detector = MTCNN()
            except Exception as e:
                logger.warning(f"Failed to initialize MTCNN: {e}")
                self.mtcnn_detector = None
        else:
            self.mtcnn_detector = None
        
        # Face encoding cache
        self.encoding_cache = {}
        
        # Check AI library availability
        self.ai_available = FACE_RECOGNITION_AVAILABLE and CV2_AVAILABLE
        
        if not self.ai_available:
            logger.warning("AI libraries not fully installed. Face recognition features limited.")
            logger.info("Install AI features with: pip install -r requirements-ai.txt")
        
        logger.info(f"Face Recognition Service initialized (AI available: {self.ai_available})")
    
    def detect_faces(self, image: np.ndarray, method: str = 'dlib') -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image using specified method
        
        Args:
            image: Input image as numpy array
            method: Detection method ('dlib', 'mtcnn', 'opencv')
        
        Returns:
            List of face locations as (top, right, bottom, left) tuples
        """
        try:
            if method == 'dlib':
                face_locations = face_recognition.face_locations(
                    image, 
                    model=self.face_model
                )
                return face_locations
            
            elif method == 'mtcnn':
                results = self.mtcnn_detector.detect_faces(image)
                face_locations = []
                
                for result in results:
                    if result['confidence'] >= self.face_detection_confidence:
                        x, y, width, height = result['box']
                        # Convert to (top, right, bottom, left) format
                        top = y
                        right = x + width
                        bottom = y + height
                        left = x
                        face_locations.append((top, right, bottom, left))
                
                return face_locations
            
            elif method == 'opencv':
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                face_cascade = cv2.CascadeClassifier(
                    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                )
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                
                face_locations = []
                for (x, y, w, h) in faces:
                    # Convert to (top, right, bottom, left) format
                    face_locations.append((y, x + w, y + h, x))
                
                return face_locations
            
            else:
                raise ValueError(f"Unknown detection method: {method}")
        
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return []
    
    def encode_face(self, image: np.ndarray, face_location: Optional[Tuple] = None) -> Optional[np.ndarray]:
        """
        Generate face encoding from image
        
        Args:
            image: Input image as numpy array
            face_location: Optional pre-detected face location
        
        Returns:
            Face encoding as numpy array or None if failed
        """
        try:
            if face_location:
                encodings = face_recognition.face_encodings(
                    image, 
                    known_face_locations=[face_location],
                    model=self.encoding_model
                )
            else:
                encodings = face_recognition.face_encodings(
                    image,
                    model=self.encoding_model
                )
            
            if encodings:
                return encodings[0]
            return None
        
        except Exception as e:
            logger.error(f"Face encoding error: {e}")
            return None
    
    def compare_faces(
        self, 
        known_encoding: np.ndarray, 
        face_encoding: np.ndarray, 
        tolerance: Optional[float] = None
    ) -> Tuple[bool, float]:
        """
        Compare two face encodings
        
        Args:
            known_encoding: Known face encoding
            face_encoding: Face encoding to compare
            tolerance: Optional custom tolerance
        
        Returns:
            Tuple of (is_match: bool, distance: float)
        """
        try:
            tolerance = tolerance or self.face_recognition_tolerance
            
            # Calculate face distance
            face_distance = face_recognition.face_distance(
                [known_encoding], 
                face_encoding
            )[0]
            
            is_match = face_distance <= tolerance
            confidence = 1.0 - face_distance
            
            return is_match, confidence
        
        except Exception as e:
            logger.error(f"Face comparison error: {e}")
            return False, 0.0
    
    def verify_face_deepface(
        self, 
        img1_path: str, 
        img2_path: str, 
        model_name: str = 'VGG-Face'
    ) -> Dict:
        """
        Verify faces using DeepFace library with multiple models
        
        Args:
            img1_path: Path to first image
            img2_path: Path to second image
            model_name: Model to use (VGG-Face, Facenet, OpenFace, DeepFace, etc.)
        
        Returns:
            Verification result dictionary
        """
        try:
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name=model_name,
                enforce_detection=True
            )
            return result
        
        except Exception as e:
            logger.error(f"DeepFace verification error: {e}")
            return {"verified": False, "distance": 1.0, "error": str(e)}
    
    def analyze_face(self, image_path: str) -> Dict:
        """
        Analyze face attributes (age, gender, emotion, race)
        
        Args:
            image_path: Path to image file
        
        Returns:
            Analysis results dictionary
        """
        try:
            analysis = DeepFace.analyze(
                img_path=image_path,
                actions=['age', 'gender', 'emotion', 'race'],
                enforce_detection=False
            )
            return analysis
        
        except Exception as e:
            logger.error(f"Face analysis error: {e}")
            return {}
    
    def detect_and_encode_faces(
        self, 
        image: np.ndarray, 
        detection_method: str = 'dlib'
    ) -> List[Dict]:
        """
        Detect all faces in image and generate encodings
        
        Args:
            image: Input image as numpy array
            detection_method: Face detection method
        
        Returns:
            List of dictionaries containing face data
        """
        faces_data = []
        
        try:
            # Detect faces
            face_locations = self.detect_faces(image, method=detection_method)
            
            if not face_locations:
                logger.warning("No faces detected in image")
                return faces_data
            
            # Generate encodings for each face
            for i, face_location in enumerate(face_locations):
                encoding = self.encode_face(image, face_location)
                
                if encoding is not None:
                    # Extract face region
                    top, right, bottom, left = face_location
                    face_image = image[top:bottom, left:right]
                    
                    faces_data.append({
                        'face_id': i,
                        'location': face_location,
                        'encoding': encoding.tolist(),
                        'face_image': face_image,
                        'detection_method': detection_method
                    })
        
        except Exception as e:
            logger.error(f"Error in detect_and_encode_faces: {e}")
        
        return faces_data
    
    def match_face_against_database(
        self, 
        face_encoding: np.ndarray, 
        known_encodings: List[Tuple[int, np.ndarray]],
        tolerance: Optional[float] = None
    ) -> Optional[Tuple[int, float]]:
        """
        Match a face encoding against a database of known encodings
        
        Args:
            face_encoding: Face encoding to match
            known_encodings: List of (user_id, encoding) tuples
            tolerance: Optional custom tolerance
        
        Returns:
            Tuple of (user_id, confidence) if match found, None otherwise
        """
        try:
            if not known_encodings:
                return None
            
            tolerance = tolerance or self.face_recognition_tolerance
            best_match = None
            best_confidence = 0.0
            
            for user_id, known_encoding in known_encodings:
                is_match, confidence = self.compare_faces(
                    known_encoding, 
                    face_encoding, 
                    tolerance
                )
                
                if is_match and confidence > best_confidence:
                    best_match = user_id
                    best_confidence = confidence
            
            if best_match:
                return (best_match, best_confidence)
            return None
        
        except Exception as e:
            logger.error(f"Face matching error: {e}")
            return None
    
    def encode_faces_from_file(self, image_path: str) -> List[np.ndarray]:
        """
        Load image from file and generate face encodings
        
        Args:
            image_path: Path to image file
        
        Returns:
            List of face encodings
        """
        try:
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image, model=self.encoding_model)
            return encodings
        
        except Exception as e:
            logger.error(f"Error encoding faces from file: {e}")
            return []
    
    def save_encoding(self, encoding: np.ndarray, file_path: str):
        """Save face encoding to file"""
        try:
            with open(file_path, 'wb') as f:
                pickle.dump(encoding, f)
            logger.info(f"Encoding saved to {file_path}")
        except Exception as e:
            logger.error(f"Error saving encoding: {e}")
    
    def load_encoding(self, file_path: str) -> Optional[np.ndarray]:
        """Load face encoding from file"""
        try:
            with open(file_path, 'rb') as f:
                encoding = pickle.load(f)
            return encoding
        except Exception as e:
            logger.error(f"Error loading encoding: {e}")
            return None
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better face detection
        
        Args:
            image: Input image
        
        Returns:
            Preprocessed image
        """
        # Convert to RGB if needed
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
        
        # Enhance contrast
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)
        
        return enhanced
    
    def draw_face_boxes(
        self, 
        image: np.ndarray, 
        face_locations: List[Tuple], 
        labels: Optional[List[str]] = None
    ) -> np.ndarray:
        """
        Draw bounding boxes around detected faces
        
        Args:
            image: Input image
            face_locations: List of face locations
            labels: Optional labels for each face
        
        Returns:
            Image with drawn boxes
        """
        output_image = image.copy()
        
        for i, (top, right, bottom, left) in enumerate(face_locations):
            # Draw rectangle
            cv2.rectangle(output_image, (left, top), (right, bottom), (0, 255, 0), 2)
            
            # Draw label if provided
            if labels and i < len(labels):
                cv2.putText(
                    output_image, 
                    labels[i], 
                    (left, top - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.5, 
                    (0, 255, 0), 
                    2
                )
        
        return output_image
