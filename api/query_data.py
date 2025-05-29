import argparse
import params
import certifi
import warnings
from pymongo import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
from google import genai
from gemini_embeddings import GeminiEmbeddings


# Filter out warnings
warnings.filterwarnings("ignore", category=UserWarning)

def search_amazon(query, category=None):
    """
    Search for Amazon products based on query and optional category filter.
    
    Args:
        query (str): Search query for Amazon products
        category (int, optional): Category ID filter (104: Suitcases, 110: Men's Clothing)
        
    Returns:
        list: List of search results with product information, category, and link
    """
    # Query negation preprocessing
    is_negated = False
    negated_clause = ""
    positive_search = ""

    client = genai.Client(api_key=params.gemini_api_key)

    is_negated_query = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[f"In the following phrase, Identify negation words: Find words \
            like 'not,' 'un-,' 'in-,' 'non-,' 'without,' and similar terms. If \
            there are any, respond yes. Otherwise, respond no.\
            Phrase: {query}"]
    )
    is_negated = (is_negated_query.text.strip().casefold() == 'yes'.casefold())

    if (is_negated):
        negated_clause_query = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[f"Extract the negated adjective from the following sentence: ‘{query}’. Return only the negated adjective (not including the negation word)."]
        )
        negated_clause = negated_clause_query.text

        positive_search_query = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[f"Please analyze the following phrase and perform these transformations:\
                1. Identify negation words: Find words like 'not,' 'un-,' 'in-,' 'non-,' 'without,' and similar terms.\
                2. Identify negated adjectives: Determine which adjectives are being negated by the identified negation words.\
                3. Remove negation words and negated adjectives: Delete both the negation words and the adjectives they negate.\
                4. Preserve other adjectives: Leave any adjectives that are not being negated intact.\
                5. Respond with only the transformed phrase\
                Phrase: {query}\
            "]
        )  
        positive_search = positive_search_query.text

    # Initialize MongoDB python client
    client = MongoClient(params.mongodb_conn_string, tlsCAFile=certifi.where())
    collection = client[params.db_name][params.collection_name]

    # Initialize vector store
    embeddings = GeminiEmbeddings()
    vectorStore = MongoDBAtlasVectorSearch(
        collection, embeddings, index_name=params.index_name
    )

    # Process search results
    results = []

    if (not is_negated):
        # Perform similarity search
        docs = vectorStore.similarity_search(query, k=5)  # Get more results to allow for filtering

        for doc in docs:

            # Add result to list
            results.append({
                "content": doc.page_content,
                # "category_name": doc_category,
                "link": doc.metadata.get('productURL')
            })

    else:
        broad_query = vectorStore.similarity_search(positive_search, k=10)
        doc_indices = [doc.metadata.get("index") for doc in broad_query]

        exclude_query = vectorStore.similarity_search(
            negated_clause,
            k=5,
            pre_filter={"index":{"$in":doc_indices}}
        )

        for doc in exclude_query:
            print(doc.metadata.get('title'))

        for doc in broad_query:
            if (not (doc in exclude_query)):
                results.append({
                    "content": doc.page_content,
                    "link": doc.metadata.get('productURL')
                })
    
    return results

