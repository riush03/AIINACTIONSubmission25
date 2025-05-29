from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import warnings
from google.oauth2 import service_account
import os
from werkzeug.utils import secure_filename
from google.cloud import storage
import uuid
from datetime import datetime
import tempfile
from query_data import search_amazon
from image_analyzer import analyze_image

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
warnings.filterwarnings("ignore", category=UserWarning)

# Define configuration for file uploads
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}

# GCP Storage configuration
GCP_BUCKET_NAME = os.environ.get('GCP_BUCKET_NAME', 'ai-data-store')
GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'adkprojects')
#GEMINI_API_KEY =  os.environ.get("GEMINI_API_KEY","")
ATLAS_URI = os.environ.get("ATLAS_URI")
DB_NAME = os.environ.get("DB_NAME")
COLLECTION_NAME = os.environ.get("COLLECTION_NAME")
INDEX_NAME = os.environ.get("INDEX_NAME")
GCP_CREDENTIALS_PATH = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'C:/Users/Administrator/newera/aiprod/backend/adkprojects-fbca87841b6f.json')


# Initialize GCP Storage client with service account credentials
try:
    # Check if credentials file exists
    if not os.path.exists(GCP_CREDENTIALS_PATH):
        raise FileNotFoundError(f"Service account key file not found: {GCP_CREDENTIALS_PATH}")
    
    # Load credentials from service account key file
    credentials = service_account.Credentials.from_service_account_file(
        GCP_CREDENTIALS_PATH,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    
    # Initialize storage client with credentials
    storage_client = storage.Client(
        project=GCP_PROJECT_ID,
        credentials=credentials
    )
    
    bucket = storage_client.bucket(GCP_BUCKET_NAME)
    
    # Test bucket access
    if bucket.exists():
        logger.info(f"Successfully connected to GCP Storage bucket: {GCP_BUCKET_NAME}")
    else:
        raise Exception(f"Bucket {GCP_BUCKET_NAME} does not exist or is not accessible")
        
except FileNotFoundError as e:
    logger.error(f"Credentials file error: {str(e)}")
    logger.error("Please ensure GOOGLE_APPLICATION_CREDENTIALS environment variable points to your service account key JSON file")
    storage_client = None
    bucket = None
except Exception as e:
    logger.error(f"Failed to initialize GCP Storage: {str(e)}")
    logger.error("Please check your GCP credentials, project ID, and bucket name")
    storage_client = None
    bucket = None


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
CORS(app)  # Enable CORS for all routes

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_to_gcs(file_obj, filename):
    """Upload file to Google Cloud Storage"""
    try:
        if not bucket:
            raise Exception("GCP Storage not initialized")
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
        gcs_filename = f"uploads/{timestamp}_{unique_id}.{file_extension}"
        
        # Create blob and upload
        blob = bucket.blob(gcs_filename)
        
        # Reset file pointer to beginning
        file_obj.seek(0)
        
        # Upload the file
        blob.upload_from_file(file_obj, content_type=f'image/{file_extension}')
        
        logger.info(f"File uploaded to GCS: {gcs_filename}")
        return gcs_filename, blob.public_url
        
    except Exception as e:
        logger.error(f"Error uploading to GCS: {str(e)}")
        raise

def delete_from_gcs(gcs_filename):
    """Delete file from Google Cloud Storage"""
    try:
        if not bucket:
            return
        
        blob = bucket.blob(gcs_filename)
        blob.delete()
        logger.info(f"File deleted from GCS: {gcs_filename}")
        
    except Exception as e:
        logger.warning(f"Failed to delete file from GCS {gcs_filename}: {str(e)}")

def download_from_gcs(gcs_filename):
    """Download file from Google Cloud Storage to temporary file"""
    try:
        if not bucket:
            raise Exception("GCP Storage not initialized")
        
        blob = bucket.blob(gcs_filename)
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        
        # Download to temporary file
        blob.download_to_filename(temp_file.name)
        
        logger.info(f"File downloaded from GCS to temporary file: {temp_file.name}")
        return temp_file.name
        
    except Exception as e:
        logger.error(f"Error downloading from GCS: {str(e)}")
        raise


@app.route('/')
def home():
    return jsonify({"message": "Server is running"}), 200

@app.route('/api/search')
def search():
    query = request.args.get('q', '')
    category = request.args.get('category')
    
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    # Convert category to int if provided
    if category:
        try:
            category = int(category)
        except ValueError:
            return jsonify({"error": "Category must be a valid integer"}), 400
    
    try:
        # Use search_amazon function from query_amazon.py
        results = search_amazon(query, category)
        
        # Log results to verify links are included
        for i, result in enumerate(results):
            logger.info(f"Result #{i+1} link: {result.get('link')}")
        
        return jsonify({
            "query": query,
            "category": category,
            "results": results,
            "total_results": len(results)
        })
    except Exception as e:
        logger.error(f"Error processing search request: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    # Check if GCP Storage is available
    if not storage_client or not bucket:
        return jsonify({"error": "Cloud storage not available"}), 503
    
    # Check if an image was included in the request
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    
    # Check if the file is empty
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    
    # Check if the file has an allowed extension
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Please use jpg, jpeg, png, or gif."}), 400
    
    gcs_filename = None
    temp_filepath = None
    
    try:
        # Get the query text if provided
        query_text = request.form.get('query', 'Find products like this')
        
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Upload to Google Cloud Storage
        gcs_filename, public_url = upload_to_gcs(file, filename)
        logger.info(f"Image uploaded to GCS: {gcs_filename}")
        
        # Download the file to a temporary location for processing
        temp_filepath = download_from_gcs(gcs_filename)
        
        # Process the image with Gemini API
        with open(temp_filepath, 'rb') as img_file:
            image_description = analyze_image(img_file, f"Describe this product in less than 50 words: {query_text}")
        
        logger.info(f"Image description: {image_description}")
        
        # If we got an error from the image analysis, still continue with basic search
        if image_description.startswith("Error analyzing image"):
            logger.warning(f"Using fallback search without image analysis: {image_description}")
            combined_query = query_text
        else:
            # Combine the original query with the image description
            combined_query = f"{query_text} {image_description}"
            
        logger.info(f"Combined query: {combined_query}")
        
        # Perform the search with the combined query
        results = search_amazon(combined_query)
        
        return jsonify({
            "query": combined_query,
            "image_description": image_description,
            "gcs_url": public_url,
            "results": results,
            "total_results": len(results)
        })
        
    except Exception as e:
        logger.error(f"Error processing image search: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
        
    finally:
        # Clean up temporary file
        if temp_filepath:
            try:
                os.remove(temp_filepath)
                logger.info(f"Temporary file {temp_filepath} removed")
            except Exception as e:
                logger.warning(f"Failed to remove temporary file {temp_filepath}: {str(e)}")
        
        # Optionally delete from GCS after processing (uncomment if you don't want to keep images)
        # if gcs_filename:
        #     delete_from_gcs(gcs_filename)

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5000")
    app.run(host="0.0.0.0", port=5000)