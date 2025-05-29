import pandas as pd
import re

# Path to the CSV file
csv_path = './data/amazon-products.csv'

# Load only the first 1000 rows
df = pd.read_csv(csv_path, nrows=500)

print(f"Loaded {len(df)} products")

# Function to search for products with a keyword in the title
def search_by_keyword(keyword):
    keyword_lower = keyword.lower()
    matches = df[df['title'].str.lower().str.contains(keyword_lower, na=False)]
    return matches

# Search for headphones
headphones_products = search_by_keyword('shoe')
print(f"\nFound {len(headphones_products)} products with 'shoe' in the title:")
for i, (idx, row) in enumerate(headphones_products.iterrows()):
    if i < 10:  # Only show first 10 for brevity
        print(f"{i+1}. {row['title']}")
    else:
        print(f"... and {len(headphones_products) - 10} more")
        break

# Also search for earbuds or earphones
earbuds_products = search_by_keyword('earbud') 
earphones_products = search_by_keyword('earphone')
wireless_products = search_by_keyword('wireless')

print(f"\nFound {len(earbuds_products)} products with 'earbud' in the title")
print(f"Found {len(earphones_products)} products with 'earphone' in the title")
print(f"Found {len(wireless_products)} products with 'wireless' in the title")

# Get unique category IDs
unique_categories = df['categories'].unique()
print(f"\nUnique category IDs in the dataset: {sorted(unique_categories)}")

# Count products by category
category_counts = df['categories'].value_counts()
print("\nNumber of products by category:")
for category, count in category_counts.items():
    print(f"Category {category}: {count} products") 