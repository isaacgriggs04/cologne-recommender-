import json
import os

# Define the fields to keep
FIELDS_TO_KEEP = [
    "Name",
    "Brand",
    "Year",
    "rating",
    "Country",
    "Image URL",
    "Gender",
    "Price",
    "OilType",
    "Longevity",
    "Sillage",
    "General Notes",
    "Main Accords",
    "Main Accords Percentage",
    "Season Ranking",
    "Occasion Ranking"
]

def filter_fragrance(fragrance):
    """Filter a fragrance object to only include specified fields."""
    filtered = {}
    for field in FIELDS_TO_KEEP:
        if field in fragrance:
            filtered[field] = fragrance[field]
        else:
            # Include empty values for missing fields to maintain structure
            if field in ["Year", "Country", "Price"]:
                filtered[field] = ""
            elif field in ["General Notes", "Main Accords"]:
                filtered[field] = []
            elif field in ["Main Accords Percentage"]:
                filtered[field] = {}
            elif field in ["Season Ranking", "Occasion Ranking"]:
                filtered[field] = []
            else:
                filtered[field] = ""
    return filtered

def main():
    input_filename = "/Users/isaac/fragella_fragrances.json"
    output_filename = "/Users/isaac/fragella_fragrances.json"  # Overwrite the same file
    
    # Check if input file exists
    if not os.path.exists(input_filename):
        print(f"Error: File {input_filename} not found!")
        return
    
    # Read the existing data
    print(f"Reading {input_filename}...")
    try:
        with open(input_filename, "r") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON file: {e}")
        return
    
    if not isinstance(data, list):
        print("Error: Expected a list of fragrances")
        return
    
    print(f"Found {len(data)} fragrances")
    
    # Filter each fragrance
    print("Filtering fragrances...")
    filtered_data = [filter_fragrance(fragrance) for fragrance in data]
    
    # Write the filtered data back
    print(f"Writing filtered data to {output_filename}...")
    with open(output_filename, "w") as f:
        json.dump(filtered_data, f, indent=4)
    
    print(f"Done! Filtered {len(filtered_data)} fragrances.")
    print(f"Kept only the following fields: {', '.join(FIELDS_TO_KEEP)}")

if __name__ == "__main__":
    main()

