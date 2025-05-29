import google.generativeai as genai
import PIL.Image
import params
import logging
import io
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API key from params or environment variable
GEMINI_API_KEY = params.gemini_api_key or os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.error("No Gemini API key found. Please set it in params.py or as an environment variable.")
else:
    logger.info(f"Configuring Gemini API with key: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")
    
# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

def analyze_image(image_file, prompt="Describe what is in this image concisely."):
    """
    Analyze an image using Google Gemini API and return a text description.
    
    Args:
        image_file: The uploaded image file
        prompt: Prompt to guide the image analysis
        
    Returns:
        str: Text description of the image content
    """
    if not GEMINI_API_KEY:
        return "Error: No Gemini API key configured"
        
    try:
        # Log file info if available
        try:
            logger.info(f"Processing image: {image_file.name if hasattr(image_file, 'name') else 'unknown'}")
        except:
            logger.info("Processing image file (details unavailable)")
        
        # Use gemini-1.5-flash model (as recommended due to deprecation of gemini-pro-vision)
        model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Using gemini-1.5-flash model")
        
        # Load and process the image
        img = PIL.Image.open(image_file)
        
        # Ensure the image is in RGB mode (Gemini API requires RGB)
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        logger.info(f"Image opened successfully. Size: {img.size}, Format: {img.format}, Mode: {img.mode}")
        
        # Generate content from the image
        logger.info(f"Sending image to Gemini API with prompt: {prompt}")
        
        generation_config = {
            "temperature": 0.4,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 200,
        }
        
        response = model.generate_content(
            [prompt, img],
            generation_config=generation_config
        )
        
        # Extract and return the text description
        description = response.text.strip()
        logger.info(f"Image analysis result: {description}")
        return description
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        return f"Error analyzing image: {str(e)}" 