import csv
import pandas as pd
import os
import google.generativeai as genai
from langchain_core.documents import Document
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from dotenv import dotenv_values
import params
import time


config = dotenv_values(".env")

# Step 1: Load Amazon product data (limited to 1000 rows)
print("Loading Amazon product data...")
# Use the correct path based on where the script is run from
csv_path = './data/amazon-products.csv'
df = pd.read_csv(csv_path, nrows=500)
print(f"Loaded {len(df)} products")

# Step 2: Convert each product into a Document
print("Converting products to documents...")
docs = []
index = 0

for _, row in df.iterrows():
    # Combine product information into a text string
    content = f"Title: {row['title']}\n"
    
    # Add other fields that exist
    if 'final_price' in row and not pd.isna(row['final_price']):
        content += f"Price: ${row['final_price']}\n"
    
    if 'rating' in row and not pd.isna(row['rating']):
        content += f"Rating: {row['rating']} stars\n"
    
    if 'reviews_count' in row and not pd.isna(row['reviews_count']):
        content += f"Reviews: {row['reviews_count']}\n"
    
    if 'categories' in row and not pd.isna(row['categories']):
        content += f"Categories: {row['categories']}\n"
    
    
    # Create a Document object with the content and metadata
    doc = Document(
        page_content=content,
        metadata={
            "title": row['title'],
            "price": row['final_price'],
            "asin": row['input_asin'],
            "image": row['image_url'],
            "productURL": row['url'],
            "source": "amazon_products",
            "index" : index
        }
    )
    docs.append(doc)
    index += 1

print(f"Created {len(docs)} document objects")

# Step 3: Configure Gemini API
print("Configuring Gemini API...")
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    print("Gemini API configured successfully")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    exit(1)

# Create a custom embedding function for Gemini
class GeminiEmbeddings:
    def __init__(self, model="models/embedding-001"):
        self.model = model
    
    def embed_documents(self, texts):
        """Embed a list of documents"""
        embeddings = []
        for i, text in enumerate(texts):
            try:
                result = genai.embed_content(
                    model=self.model,
                    content=text
                )
                embeddings.append(result['embedding'])
                if (i + 1) % 50 == 0:  # Progress indicator
                    print(f"Embedded {i + 1}/{len(texts)} documents")
            except Exception as e:
                print(f"Error embedding document {i}: {e}")
                # Use zero vector as fallback
                embeddings.append([0.0] * 768)
        return embeddings
    
    def embed_query(self, text):
        """Embed a single query"""
        try:
            result = genai.embed_content(
                model=self.model,
                content=text
            )
            return result['embedding']
        except Exception as e:
            print(f"Error embedding query: {e}")
            return [0.0] * 768

# Initialize the custom embeddings class
embeddings = GeminiEmbeddings()

# Step 4: Store
print("Connecting to MongoDB...")
# Initialize MongoDB python client
client = MongoClient(params.mongodb_conn_string)
db = client[params.db_name]
collection = db[params.collection_name]

# Reset without deleting the Search Index 
print("Deleting existing documents...")
collection.delete_many({})


# Try to create the vector search index if it doesn't exist
try:
    print(f"Checking for vector search index '{params.index_name}'...")
    # List all indexes to see if our vector index exists
    indexes = list(collection.list_indexes())
    print(indexes)
    index_exists = False
    for index in indexes:
        if index.get('name') == params.index_name:
            index_exists = True
            print(f"Vector index '{params.index_name}' already exists")
            break
    
    if not index_exists:
        print(f"Creating vector search index '{params.index_name}'...")
        # Create the vector search index
        index_definition = {
            "fields": [
                {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": 768,  # Gemini embedding-001 has 768 dimensions
                    "similarity": "cosine"
                }
            ]
        }
        
        # Try to create the search index
        try:
            db.command({
                "createSearchIndex": params.collection_name,
                "name": params.index_name,
                "definition": index_definition
            })
            print(f"Created vector search index '{params.index_name}'")
        except Exception as e:
            print(f"Error creating search index: {e}")
except Exception as e:
    print(f"Error checking indexes: {e}")

# Insert the documents in MongoDB Atlas with their embedding
print("Storing documents with embeddings...")
docsearch = MongoDBAtlasVectorSearch.from_documents(
    docs, embeddings, collection=collection, index_name=params.index_name
)

# Verify documents were inserted
count = collection.count_documents({})
print(f"Inserted {count} documents")

# Check if a document has an embedding field
doc = collection.find_one()
if doc and 'embedding' in doc:
    print(f"Embeddings stored correctly. Vector dimension: {len(doc['embedding'])}")
else:
    print("WARNING: Embeddings not found in documents")
    if doc:
        print(f"Fields in document: {list(doc.keys())}")

# Wait a moment for the index to be ready
print("Waiting a moment for the index to be ready...")
time.sleep(2)

# Test a search
print("Testing search functionality...")
try:
    test_results = docsearch.similarity_search("Kishigo Premium Black Series Heavy Duty", k=1)
    if test_results and len(test_results) > 0:
        print(f"Search test successful. Found {len(test_results)} results.")
        print(f"Sample result: {test_results[0].page_content[:100]}...")
    else:
        print("WARNING: Search test returned no results.")
except Exception as e:
    print(f"Error during search test: {e}")

print("Amazon product vectorization with Gemini embeddings complete!")